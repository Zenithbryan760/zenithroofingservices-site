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

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const cors = corsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };

  try {
    const data = parseBody(event);

    const {
      JN_API_KEY,
      JN_CONTACT_ENDPOINT,
      RECAPTCHA_SECRET
    } = process.env;

    if (!JN_API_KEY || !JN_CONTACT_ENDPOINT) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Server not configured (missing env vars)' }) };
    }

    // Netlify values can pick up whitespace, or an operator may paste the
    // complete "Bearer <token>" value. JobNimbus expects only the normalized
    // token after the Bearer scheme.
    const normalizedApiKey = JN_API_KEY
      .trim()
      .replace(/^bearer\s+/i, '');
    const contactEndpoint = JN_CONTACT_ENDPOINT.trim();

    // ---- reCAPTCHA (if enabled) ----
    if (RECAPTCHA_SECRET) {
      const token = (data.recaptcha_token || '').trim();
      if (!token) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing recaptcha token' }) };
      const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token }),
      });
      const verifyJson = await verifyRes.json();
      console.log('[jn-create-lead] recaptcha verification:', {
        success: verifyJson.success,
        hostname: verifyJson.hostname || '',
        errorCodes: verifyJson['error-codes'] || []
      });
      if (!verifyJson.success) {
        const errorCodes = Array.isArray(verifyJson['error-codes'])
          ? verifyJson['error-codes'].join(', ')
          : '';
        return {
          statusCode: 400,
          headers: cors,
          body: JSON.stringify({
            error: errorCodes ? `Recaptcha failed: ${errorCodes}` : 'Recaptcha failed'
          })
        };
      }
    }

    // ---- Normalize inputs (needed later) ----
    const first = (data.first_name || '').trim();
    const last  = (data.last_name  || '').trim();
    const email = (data.email      || '').trim();

    // ---- Address normalization (robust) ----
    const streetFromAny = (
      data.street_address ||
      data['street-address'] ||
      data.streetAddress ||
      data.address1 ||
      data.addr1 ||
      data.address_line1 ||
      data.addressLine1 ||
      data['address[street]'] ||   // handles bracketed form names
      data.line1 ||
      data.line_1 ||
      data.street ||
      data.address ||
      ''
    ).toString().trim();

    const addressObj = {
      street: streetFromAny,
      city:   (data.city  || '').toString().trim(),
      state:  (data.state || '').toString().trim(),
      zip:    (data.zip   || '').toString().trim(),
    };

    // ---- Required-field and format validation ----
    const description = (data.description || '').toString().trim();
    const referralSource = (data.referral_source || '').toString().trim();
    const zip5 = addressObj.zip.slice(0, 5);
    const zipNumber = Number(zip5);
    const stateNormalized = addressObj.state.toUpperCase();

    if (!first || !last)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'First and last name are required' }) };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'A valid email address is required' }) };
    if (!addressObj.street || !addressObj.city)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'A complete street address and city are required' }) };
    if (stateNormalized !== 'CA' && stateNormalized !== 'CALIFORNIA')
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'The property must be located in California' }) };
    if (!/^\d{5}(?:-\d{4})?$/.test(addressObj.zip) || zipNumber < 90001 || zipNumber > 96162)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Enter a valid California ZIP code' }) };
    if (!description)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Please provide a brief description of the roofing request' }) };
    if (!referralSource)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Lead source is required' }) };

    const phoneDigits = normalizePhone(data.phone || data.phone_number || '');
    if (!phoneDigits)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Phone number is required' }) };
    if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(phoneDigits))
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Enter a valid 10-digit US phone number' }) };
    const formattedPhone = `(${phoneDigits.slice(0,3)}) ${phoneDigits.slice(3,6)}-${phoneDigits.slice(6)}`;

    // ---- Description BACKUP (include EVERYTHING useful) ----
    const addressLine = [addressObj.street, addressObj.city, addressObj.state, addressObj.zip]
      .filter(Boolean).join(', ');
    const nameLine = [first, last].filter(Boolean).join(' ').trim();
    const descLines = [
      `Submitted: ${new Date().toISOString()}`,
      nameLine ? `Name: ${nameLine}` : null,
      email ? `Email: ${email}` : null,
      `Phone: ${formattedPhone}`,
      addressLine ? `Address: ${addressLine}` : null,
      (data.service_type || '').trim()    ? `Service Type: ${data.service_type.trim()}` : null,
      (data.referral_source || '').trim() ? `Referral: ${data.referral_source.trim()}` : null,
      (data.page || '').trim()            ? `Page: ${data.page.trim()}` : null,
      (data.description || '').trim()     ? `Notes: ${data.description.trim()}` : null,
    ].filter(Boolean);
    const combinedDescription = descLines.join('\n');

    // ---- Build unique display_name (base + last4 or city) ----
    const baseName =
      [first, last].filter(Boolean).join(' ').trim() ||
      email || formattedPhone || 'Website Lead';

    const last4 = phoneDigits.slice(-4);
    const cityToken = (data.city || '').trim().split(/\s+/)[0] || '';
    const uniqueTag = last4 || cityToken || new Date().toISOString().slice(2,10).replace(/-/g, '');
    let displayName = `${baseName} – ${uniqueTag}`;

    // ---- JobNimbus payload ----
    const payloadBase = {
      display_name: displayName,

      // contact identity
      first_name: first,
      last_name:  last,
      email,

      // phones — map to visible JN fields
      main_phone:   phoneDigits,
      mobile_phone: phoneDigits,
      phone_formatted: formattedPhone,

      // address — include JobNimbus API field names plus legacy aliases
      address_line1: addressObj.street,
      address_line2: (data.address2 || '').toString().trim(),
      state_text:    addressObj.state,
      address1:      addressObj.street,
      address2:      (data.address2 || '').toString().trim(),
      city:          addressObj.city,
      state:         addressObj.state,
      postal_code:   addressObj.zip,
      zip:           addressObj.zip,

      // UI fields that show up in the modal
      lead_source:      referralSource,
      lead_source_name: referralSource,
      source_name:       referralSource,
      description: combinedDescription,           // ✅ includes ALL fields for backup
      website:     (data.page || '').trim(),
      company:     (data.company || '').trim(),

      // metadata
      service_type: data.service_type || '',
      _source:  'website-jn-create-lead',
      _version: 'jn-create-lead-' + new Date().toISOString().split('T')[0],
    };

    // ---- Auth header variants ----
    // JobNimbus documents Bearer authentication. Keep legacy variants only as
    // fallbacks for older tenant configurations.
    const headerVariants = [
      { 'Authorization': `Bearer ${normalizedApiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      { 'x-api-key': normalizedApiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      { 'Authorization': normalizedApiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' }, // legacy last resort
    ];

    // Helper to POST to JobNimbus
    const postToJN = async (headers, body) => {
      const r = await fetch(contactEndpoint, { method: 'POST', headers, body: JSON.stringify(body) });
      const t = await r.text();
      return { r, t };
    };

    // 1st attempt
    let { r: jnRes, t: jnText } = await postToJN(headerVariants[0], payloadBase);
    console.log('[jn-create-lead] JN first attempt status:', jnRes.status);

    // If unauthorized/forbidden, try the other auth header styles
    if (jnRes.status === 401 || jnRes.status === 403) {
      for (let i = 1; i < headerVariants.length; i++) {
        ({ r: jnRes, t: jnText } = await postToJN(headerVariants[i], payloadBase));
        console.log(`[jn-create-lead] JN auth attempt ${i + 1} status:`, jnRes.status);
        if (jnRes.status !== 401 && jnRes.status !== 403) break;
      }
    }

    // JobNimbus rejects lead-source labels that do not exactly match an
    // account setting. Preserve attribution in the description, then retry
    // without the structured source fields so the contact is not lost.
    if (jnRes.status === 400 && referralSource) {
      const payloadWithoutSource = { ...payloadBase };
      delete payloadWithoutSource.lead_source;
      delete payloadWithoutSource.lead_source_name;
      delete payloadWithoutSource.source_name;
      ({ r: jnRes, t: jnText } = await postToJN(headerVariants[0], payloadWithoutSource));
      console.log('[jn-create-lead] JN source-free retry status:', jnRes.status);
    }

    // If duplicate error, retry once with a stronger unique suffix
    if (!jnRes.ok && /Duplicate contact exists/i.test(jnText)) {
      displayName = `${baseName} – ${uniqueTag}-${Date.now().toString().slice(-4)}`;
      const payloadRetry = { ...payloadBase, display_name: displayName };
      ({ r: jnRes, t: jnText } = await postToJN(headerVariants[0], payloadRetry));
    }

    // If still not OK, return a safe status without exposing upstream data.
    if (!jnRes.ok) {
      return {
        statusCode: jnRes.status,
        headers: cors,
        body: JSON.stringify({
          error: `JobNimbus ${jnRes.status}`
        })
      };
    }

    // Pass JN response through on success
    let body = jnText;
    try { const jnJson = JSON.parse(jnText); body = JSON.stringify(jnJson); } catch {}
    return { statusCode: jnRes.status, headers: cors, body };

  } catch (err) {
    console.error('Handler error:', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Internal server error', details: err.message }) };
  }
};
