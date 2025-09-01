// netlify/functions/jn-universal-lead.js
const allowedOrigins = [
  'https://zenithroofingca.com',
  'https://www.zenithroofingca.com',
  'https://zenithroofingservices.com',
  'https://www.zenithroofingservices.com',
  'http://localhost:8888',
  'http://localhost:5173',
];
const isPreviewOrigin = (origin) => { try { return new URL(origin).hostname.endsWith('.netlify.app'); } catch { return false; } };
const corsHeaders = (origin) => {
  const headers = { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Vary': 'Origin' };
  if (allowedOrigins.includes(origin) || isPreviewOrigin(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
};

const normalizePhone = (raw = '') => (String(raw).match(/\d/g) || []).join('').replace(/^1(?=\d{10}$)/, '');
const parseBody = (event) => {
  const ct = (event.headers['content-type'] || event.headers['Content-Type'] || '').toLowerCase();
  if (ct.includes('application/json')) return JSON.parse(event.body || '{}');
  const params = new URLSearchParams(event.body || ''); return Object.fromEntries(params.entries());
};
const originHostKey = (origin) => {
  try {
    const host = new URL(origin).hostname.replace(/^www\./, '');
    if (host.includes('zenithroofingservices')) return 'zenithroofingservices';
    if (host.includes('zenithroofingca')) return 'zenithroofingca';
    if (host.endsWith('.netlify.app')) return 'preview';
    if (host.startsWith('localhost')) return 'localhost';
    return host || 'unknown';
  } catch { return 'unknown'; }
};

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const cors = corsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };

  try {
    const data = parseBody(event);

    const { JN_API_KEY, JN_CONTACT_ENDPOINT, RECAPTCHA_SECRET, SENDGRID_API_KEY, LEAD_NOTIFY_FROM, LEAD_NOTIFY_TO } = process.env;
    if (!JN_API_KEY || !JN_CONTACT_ENDPOINT) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Server not configured (missing env vars)' }) };
    }

    // reCAPTCHA verify (if secret set)
    if (RECAPTCHA_SECRET) {
      const token = (data.recaptcha_token || '').trim();
      if (!token) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing recaptcha token' }) };
      const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Recaptcha failed' }) };
    }

    const first = (data.first_name || '').trim();
    const last  = (data.last_name  || '').trim();
    const email = (data.email      || '').trim();
    const rawPhone = data.phone_number || data.phone || data.phoneNumber || '';
    const phone = normalizePhone(rawPhone);
    if (!phone)              return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Phone number is required' }) };
    if (phone.length !== 10) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: `Invalid phone number (${phone})` }) };

    const formattedPhone = `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`;

    const descLines = [`Phone: ${formattedPhone}`];
    if ((data.service_type || '').trim())    descLines.push(`Service Type: ${data.service_type.trim()}`);
    if ((data.description || '').trim())     descLines.push(`Details: ${data.description.trim()}`);
    if ((data.referral_source || '').trim()) descLines.push(`Heard About Us: ${data.referral_source.trim()}`);
    if ((data.service_category || data.category || '').trim()) descLines.push(`Category: ${(data.service_category || data.category || '').trim()}`);
    if ((data.page_title || '').trim())      descLines.push(`Page: ${data.page_title.trim()}`);
    if ((data.page_url || '').trim())        descLines.push(`URL: ${data.page_url.trim()}`);
    if ((data.hostname || '').trim())        descLines.push(`Host: ${data.hostname.trim()}`);
    const combinedDescription = descLines.join('\n');

    const siteKey = originHostKey(origin);

    // Create contact in JobNimbus
    const payload = {
      display_name: [first, last].filter(Boolean).join(' ').trim() || email || formattedPhone || 'Website Lead',
      first_name: first,
      last_name:  last,
      email,
      phone,
      phone_formatted: formattedPhone,
      address: `${data.street_address || ''}, ${data.city || ''}, ${data.state || ''} ${data.zip || ''}`.trim(),
      description: combinedDescription,
      service_type: data.service_type || '',
      referral_source: data.referral_source || '',
      _source: `website-${siteKey}`,
      _version: 'jn-universal-lead-' + new Date().toISOString().split('T')[0],
    };

    const jnRes = await fetch(JN_CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${JN_API_KEY}` },
      body: JSON.stringify(payload),
    });
    const jnText = await jnRes.text();

    // SendGrid email (with optional photo attachments)
    let mailStatus = 'skipped';
    try {
      if (SENDGRID_API_KEY && LEAD_NOTIFY_FROM && LEAD_NOTIFY_TO) {
        const subject = `New Website Lead: ${[first, last].filter(Boolean).join(' ') || formattedPhone || email}`;
        const html = `
          <h2>New Website Lead</h2>
          <table cellspacing="0" cellpadding="6" style="font-family:Arial,Helvetica,sans-serif;font-size:14px">
            <tr><td><b>Name</b></td><td>${first} ${last}</td></tr>
            <tr><td><b>Email</b></td><td>${email}</td></tr>
            <tr><td><b>Phone</b></td><td>${formattedPhone}</td></tr>
            <tr><td><b>Address</b></td><td>${data.street_address}, ${data.city}, ${data.state} ${data.zip}</td></tr>
            <tr><td><b>Details</b></td><td>${(combinedDescription || '').replace(/\n/g, '<br>')}</td></tr>
          </table>`;
        const text = `New website lead
Name: ${first} ${last}
Email: ${email}
Phone: ${formattedPhone}
Address: ${data.street_address}, ${data.city}, ${data.state} ${data.zip}

${combinedDescription || ''}`;

        const attachments = Array.isArray(data.attachments) ? data.attachments
          .filter(a => a && a.data && a.filename)
          .map(a => ({ content: a.data, filename: a.filename, type: a.type || 'application/octet-stream', disposition: 'attachment' }))
          : undefined;

        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: LEAD_NOTIFY_TO }], subject }],
            from: { email: LEAD_NOTIFY_FROM, name: 'Zenith Roofing Website' },
            reply_to: email ? { email } : undefined,
            content: [{ type: 'text/plain', value: text }, { type: 'text/html', value: html }],
            attachments
          }),
        });
        mailStatus = `${sgRes.status}`;
      }
    } catch (e) { console.error('SendGrid error:', e); mailStatus = 'error'; }

    let body = jnText;
    try { const jnJson = JSON.parse(jnText); jnJson._mailStatus = mailStatus; body = JSON.stringify(jnJson); } catch {}

    return { statusCode: jnRes.status, headers: cors, body };
  } catch (err) {
    console.error('Handler error:', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Internal server error', details: err.message }) };
  }
};
