// netlify/functions/jn-create-lead.js

// ---------- Allowed origins / CORS ----------
const allowedOrigins = [
  'https://zenithroofingca.com',
  'https://www.zenithroofingca.com',
  'https://zenithroofingservices.com',
  'https://www.zenithroofingservices.com',
  'http://localhost:8888', // netlify dev
  'http://localhost:5173', // vite (if used)
];

const isPreviewOrigin = (origin) => {
  try { return new URL(origin).hostname.endsWith('.netlify.app'); }
  catch { return false; }
};

const corsHeaders = (origin) => {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
  if (allowedOrigins.includes(origin) || isPreviewOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
};

// ---------- Utilities ----------
const normalizePhone = (raw = '') =>
  (String(raw).match(/\d/g) || []).join('').replace(/^1(?=\d{10}$)/, '');

const parseBody = (event) => {
  const ct = (event.headers['content-type'] || event.headers['Content-Type'] || '').toLowerCase();
  if (ct.includes('application/json')) return JSON.parse(event.body || '{}');
  return Object.fromEntries(new URLSearchParams(event.body || '').entries());
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

// ---------- Handler ----------
exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const cors = corsHeaders(origin);

  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };

  try {
    const data = parseBody(event);

    const JN_API_KEY = process.env.JN_API_KEY;
    const JN_CONTACT_ENDPOINT = process.env.JN_CONTACT_ENDPOINT; // https://app.jobnimbus.com/api1/contacts
    if (!JN_API_KEY || !JN_CONTACT_ENDPOINT) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Server not configured (missing JN_API_KEY or JN_CONTACT_ENDPOINT)' }) };
    }

    const first = (data.first_name || '').trim();
    const last  = (data.last_name  || '').trim();
    const email = (data.email      || '').trim();
    const phone = normalizePhone(data.phone_number || data.phone || data.phoneNumber || '');
    if (!phone)   return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Phone number is required' }) };
    if (phone.length !== 10) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: `Invalid phone number (${phone})` }) };
    const formattedPhone = `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`;
    const phoneLast4 = phone.slice(-4);

    const descLines = [`Phone: ${formattedPhone}`];
    if ((data.service_type || '').trim())    descLines.push(`Service Type: ${String(data.service_type).trim()}`);
    if ((data.description || '').trim())     descLines.push(`Details: ${String(data.description).trim()}`);
    if ((data.referral_source || '').trim()) descLines.push(`Heard About Us: ${String(data.referral_source).trim()}`);
    const combinedDescription = descLines.join('\n');

    const siteKey = originHostKey(origin);

    // 👉 Respect incoming display_name, else build one; then make it more unique
    const incomingDisplay = (data.display_name || '').trim();
    const baseDisplay =
      incomingDisplay ||
      [first, last].filter(Boolean).join(' ').trim() ||
      email ||
      formattedPhone ||
      'Website Lead';

    const initialDisplay = phoneLast4 ? `${baseDisplay} • ${phoneLast4}` : baseDisplay;

    const makePayload = (displayName) => ({
      display_name: displayName,
      first_name: first,
      last_name: last,
      email,
      phone,                                     // numeric only
      phone_formatted: formattedPhone,
      address: `${data.street_address || ''}, ${data.city || ''}, ${data.state || ''} ${data.zip || ''}`.trim(),
      description: combinedDescription,
      service_type: data.service_type || '',
      referral_source: data.referral_source || '',
      // Friendly defaults many orgs require
      status_name: data.status_name || 'Lead',
      contact_type: data.contact_type || 'Customer',
      source_name: data.referral_source || 'Website',
      _source: `website-${siteKey}`,
      _version: 'jn-create-lead-' + new Date().toISOString().split('T')[0],
    });

    const sendToJN = async (payload) => {
      const res = await fetch(JN_CONTACT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${JN_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, text };
    };

    // 1) First attempt
    let payload = makePayload(initialDisplay);
    let { ok, status, text } = await sendToJN(payload);

    // 2) If duplicate, retry once with a timestamp suffix to guarantee uniqueness
    const duplicate = (text || '').toLowerCase().includes('duplicate contact exists');
    if (!ok && (status === 400 || status === 409) && duplicate) {
      const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0,12); // yyyymmddhhmm
      payload = makePayload(`${initialDisplay} #${stamp}`);
      ({ ok, status, text } = await sendToJN(payload));
    }

    if (!ok) {
      // Bubble JN’s message to the browser so you can see exactly why
      return { statusCode: status, headers: cors, body: text || JSON.stringify({ error: 'JobNimbus request failed' }) };
    }

    // ----- Optional SendGrid notification (unchanged) -----
    let mailStatus = 'skipped';
    try {
      const SG_KEY = process.env.SENDGRID_API_KEY;
      const TO = process.env.LEAD_NOTIFY_TO;
      const FROM = process.env.LEAD_NOTIFY_FROM;
      if (SG_KEY && TO && FROM) {
        const subject = `New Website Lead: ${[first, last].filter(Boolean).join(' ') || formattedPhone || email}`;
        const html = `
          <h2>New Website Lead</h2>
          <table cellspacing="0" cellpadding="6" style="font-family:Arial,Helvetica,sans-serif;font-size:14px">
            <tr><td><b>Name</b></td><td>${first} ${last}</td></tr>
            <tr><td><b>Email</b></td><td>${email}</td></tr>
            <tr><td><b>Phone</b></td><td>${formattedPhone}</td></tr>
            <tr><td><b>Address</b></td><td>${data.street_address}, ${data.city}, ${data.state} ${data.zip}</td></tr>
            <tr><td><b>Description</b></td><td>${(combinedDescription || '').replace(/\n/g, '<br>')}</td></tr>
          </table>`;
        const textPlain = `New website lead
Name: ${first} ${last}
Email: ${email}
Phone: ${formattedPhone}
Address: ${data.street_address}, ${data.city}, ${data.state} ${data.zip}

${combinedDescription || ''}`;
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${SG_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: TO }], subject }],
            from: { email: FROM, name: 'Zenith Roofing Website' },
            reply_to: email ? { email } : undefined,
            content: [{ type: 'text/plain', value: textPlain }, { type: 'text/html', value: html }],
          }),
        });
        mailStatus = 'sent';
      }
    } catch {
      mailStatus = 'error';
    }

    // success
    let bodyOut = text;
    try { const j = JSON.parse(text); j._mailStatus = mailStatus; bodyOut = JSON.stringify(j); } catch {}
    return { statusCode: 200, headers: cors, body: bodyOut };
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Internal server error', details: err.message }) };
  }
};
