// netlify/functions/jn-create-lead.js

// ===== CORS =====
const allowedOrigins = [
  'https://zenithroofingca.com',
  'https://www.zenithroofingca.com',
  'https://zenithroofingservices.com',
  'https://www.zenithroofingservices.com',
  'http://localhost:8888',
  'http://localhost:5173',
];

const isPreviewOrigin = (origin) => {
  try { return new URL(origin).hostname.endsWith('.netlify.app'); }
  catch { return false; }
};

const corsHeaders = (origin) => {
  const h = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  };
  if (allowedOrigins.includes(origin) || isPreviewOrigin(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
  }
  return h;
};

// ===== Body parsing =====
const parseBody = (event) => {
  const ct = (event.headers['content-type'] || event.headers['Content-Type'] || '').toLowerCase();
  if (ct.includes('application/json')) return JSON.parse(event.body || '{}');
  if (ct.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(event.body || '');
    return Object.fromEntries(params.entries());
  }
  try {
    const params = new URLSearchParams(event.body || '');
    return Object.fromEntries(params.entries());
  } catch {
    return {};
  }
};

// ===== Helpers =====
const onlyDigits = (s) => (s || '').replace(/\D+/g, '');
const normalizePhone = (s) => onlyDigits(s).slice(0, 10);

// ===== Handler =====
exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const cors = corsHeaders(origin);

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };
  }

  try {
    const data = parseBody(event);

    const {
      JN_API_KEY,
      JN_CONTACT_ENDPOINT,
      RECAPTCHA_SECRET,        // optional: enforce if present
      SENDGRID_API_KEY,        // optional: notification
      LEAD_NOTIFY_FROM,        // optional
      LEAD_NOTIFY_TO           // optional
    } = process.env;

    if (!JN_API_KEY || !JN_CONTACT_ENDPOINT) {
      return {
        statusCode: 500,
        headers: cors,
        body: JSON.stringify({ error: 'Server not configured (missing env vars)' })
      };
    }

    // ---- reCAPTCHA verify (only if RECAPTCHA_SECRET is set) ----
    if (RECAPTCHA_SECRET) {
      const token = (data.recaptcha_token || '').trim();
      if (!token) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing recaptcha token' }) };
      }

      const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Recaptcha failed' }) };
      }
    }

    // ---- Basic field cleanup ----
    const first = (data.first_name || '').trim();
    const last  = (data.last_name  || '').trim();
    const email = (data.email      || '').trim();

    const phoneDigits = normalizePhone(data.phone || data.phone_number || '');
    if (!phoneDigits)              return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Phone number is required' }) };
    if (phoneDigits.length !== 10) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: `Invalid phone number (${phoneDigits})` }) };
    const formattedPhone = `(${phoneDigits.slice(0,3)}) ${phoneDigits.slice(3,6)}-${phoneDigits.slice(6)}`;

    const descLines = [`Phone: ${formattedPhone}`];
    if ((data.service_type || '').trim())    descLines.push(`Service Type: ${data.service_type.trim()}`);
    if ((data.referral_source || '').trim()) descLines.push(`Referral: ${data.referral_source.trim()}`);
    if ((data.description || '').trim())     descLines.push(`Notes: ${data.description.trim()}`);
    if ((data.page || '').trim())            descLines.push(`Page: ${data.page.trim()}`);
    const combinedDescription = descLines.join('\n');

    // ---- JobNimbus payload ----
    const payload = {
      display_name: [first, last].filter(Boolean).join(' ').trim() || email || formattedPhone || 'Website Lead',
      first_name: first,
      last_name:  last,
      email,
      phone: phoneDigits,
      phone_formatted: formattedPhone,
      address: `${data.street_address || ''}, ${data.city || ''}, ${data.state || ''} ${data.zip || ''}`.trim(),
      description: combinedDescription,
      service_type: data.service_type || '',
      referral_source: data.referral_source || '',
      _source: 'website-jn-create-lead',
      _version: 'jn-create-lead-' + new Date().toISOString().split('T')[0],
    };

    // ---- Create contact in JobNimbus (robust auth header selection) ----
    const headerVariants = [
      { 'x-api-key': JN_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      { 'Authorization': `Bearer ${JN_API_KEY}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      { 'Authorization': JN_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' }, // legacy last resort
    ];

    let jnRes, jnText, chosenIdx = 0;
    for (let i = 0; i < headerVariants.length; i++) {
      const headers = headerVariants[i];
      jnRes = await fetch(JN_CONTACT_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      jnText = await jnRes.text();

      // accept first non-401/403 or success
      if (jnRes.status !== 401 && jnRes.status !== 403) { chosenIdx = i; break; }
    }

    try { console.log('JobNimbus status:', jnRes.status, 'using headers:', Object.keys(headerVariants[chosenIdx])); } catch {}

    if (!jnRes.ok) {
      // Echo upstream error so you can see it in DevTools Response
      return {
        statusCode: jnRes.status,
        headers: cors,
        body: JSON.stringify({
          error: `JobNimbus ${jnRes.status}`,
          message: (jnText || '').slice(0, 800)
        })
      };
    }

    // ---- Optional: Email notify via SendGrid ----
    if (SENDGRID_API_KEY && LEAD_NOTIFY_FROM && LEAD_NOTIFY_TO) {
      try {
        const message = [
          `<strong>New Website Lead</strong>`,
          `Name: ${payload.display_name}`,
          `Email: ${email || '(none)'}`,
          `Phone: ${formattedPhone}`,
          `Address: ${payload.address || '(none)'}`,
          `Service: ${payload.service_type || '(none)'}`,
          `Referral: ${payload.referral_source || '(none)'}`,
          `Page: ${data.page || '(unknown)'}`,
          '',
          `Notes:`,
          (data.description || '(none)')
        ].join('<br>');

        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: LEAD_NOTIFY_TO }] }],
            from: { email: LEAD_NOTIFY_FROM, name: 'Zenith Roofing Website' },
            subject: 'New Website Lead',
            content: [{ type: 'text/html', value: message }]
          })
        });
      } catch (e) {
        console.error('SendGrid error:', e);
      }
    }

    // Pass JN response through on success
    let body = jnText;
    try { const jnJson = JSON.parse(jnText); body = JSON.stringify(jnJson); } catch {}
    return { statusCode: jnRes.status, headers: cors, body };

  } catch (err) {
    console.error('Handler error:', err);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: 'Internal server error', details: err.message })
    };
  }
};
