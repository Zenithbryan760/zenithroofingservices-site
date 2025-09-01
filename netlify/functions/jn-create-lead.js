<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Seamless Gutters & Gutter Guards | Zenith Roofing Services</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Seamless aluminum gutters (5&quot; & 6&quot;) and gutter guard installation in North County San Diego, Greater San Diego, and Temecula. Custom on-site fabrication, color-matched to your home, and professional installation." />
  <link rel="canonical" href="https://www.zenithroofingservices.com/services/gutters/">

  <!-- Your shared site styles -->
  <link rel="stylesheet" href="/css/header.css">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/footer.css">
  <link rel="stylesheet" href="/css/ui.css">

  <!-- Adapter styles (error box + disclaimer) -->
  <link rel="stylesheet" href="/assets/jn-adapter.css">

  <!-- Optional: slight cue for invalid required inputs -->
  <style>
    input:required:invalid, textarea:required:invalid { outline: 2px solid #ef4444; }
    .lede { color:#475569; font-size:1.075rem; margin:8px 0 18px }
    .badge { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; background:#f1f5f9; font-weight:600; font-size:.95rem }
    .muted { color:var(--ui-muted) }
    .small { font-size:.9rem }
    .page.gutters{max-width:1100px;margin:24px auto;padding:0 16px}
    .svc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
    .card h2{margin:0 0 6px}
  </style>

  <!-- Your site scripts -->
  <script defer src="/js/loader.js"></script>
  <script defer src="/js/header.js"></script>

  <!-- Adapter (attaches to the form and posts to JobNimbus) -->
  <script defer src="/assets/jn-adapter.js"></script>
</head>
<body>
  <div data-include="/components/header-section.html"></div>

  <main class="page gutters" id="top">
    <section class="card airy">
      <span class="badge">Seamless Gutters</span>
      <h1>Seamless Aluminum Gutters & Gutter Guards</h1>
      <p class="lede">
        We custom-form seamless <strong>5&quot; and 6&quot; aluminum</strong> gutters on site for a perfect fit,
        then install color-matched downspouts and optional gutter guards to keep debris out.
      </p>
      <div class="svc-grid">
        <div class="card">
          <h2>Why Seamless?</h2>
          <ul class="checklist relaxed">
            <li>Fewer joints = fewer leak points</li>
            <li>Clean, continuous look</li>
            <li>Formed to your home on site</li>
          </ul>
        </div>
        <div class="card">
          <h2>Options</h2>
          <ul class="checklist relaxed">
            <li>5&quot; &amp; 6&quot; K-style aluminum</li>
            <li>Many factory colors</li>
            <li>Gutter guards available</li>
          </ul>
        </div>
        <div class="card">
          <h2>Good to Know</h2>
          <ul class="checklist relaxed">
            <li>Proper slope &amp; hanger spacing</li>
            <li>Downspout placement that works</li>
            <li>Neat jobsite and haul-away</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Estimate / Lead form -->
    <section id="estimate" class="card airy"
             data-estimate-context
             data-category="Seamless Gutters & Gutter Guards"
             data-redirect="/thank-you/">
      <h2 style="margin-top:0">Get a Free Gutter Quote</h2>
      <p class="muted small">Tell us a little about your home and we’ll follow up quickly.</p>

      <!-- The adapter will handle submission via fetch, but we also set action for no-JS fallback -->
      <form id="estimate-form" method="POST" action="/.netlify/functions/jn-create-lead" novalidate>
        <!-- Not required, adapter will infer this from data-category; but keeping won’t hurt -->
        <input type="hidden" name="service_type" value="Seamless Gutters & Gutter Guards">

        <div class="form-row">
          <div class="form-col-6">
            <label>First Name</label>
            <input name="first_name" required>
          </div>
          <div class="form-col-6">
            <label>Last Name</label>
            <input name="last_name" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col-6">
            <label>Phone</label>
            <input name="phone" type="tel" required>
          </div>
          <div class="form-col-6">
            <label>Email <span class="muted">(optional)</span></label>
            <input name="email" type="email">
          </div>
        </div>

        <div class="form-row">
          <div class="form-col-6">
            <label>Street Address</label>
            <input name="street_address">
          </div>
          <div class="form-col-3">
            <label>City</label>
            <input name="city">
          </div>
          <div class="form-col-3">
            <label>State</label>
            <input name="state" maxlength="2" placeholder="CA">
          </div>
        </div>

        <div class="form-row">
          <div class="form-col-3">
            <label>ZIP</label>
            <input name="zip" required>
          </div>
          <div class="form-col-9">
            <label>Notes</label>
            <textarea name="description" rows="4"
              placeholder="Approx. linear feet? 5&quot; or 6&quot;? Any problem areas? Interested in gutter guards?"></textarea>
          </div>
        </div>

        <!-- Spam honeypot (adapter will ignore submission if filled) -->
        <input name="company" tabindex="-1" autocomplete="off" style="display:none">

        <button class="btn" type="submit">Send Request</button>
        <!-- The adapter adds the disclaimer below the button automatically -->
      </form>
    </section>

    <section class="card airy" aria-label="Service area">
      <h2>Service Area</h2>
      <p class="muted">North County San Diego, Greater San Diego, Temecula & nearby communities.</p>
      <p class="muted small">Information above reflects common practices. Final scope and warranties are governed by your signed contract and manufacturer documentation.</p>
    </section>
  </main>

  <div data-include="/components/footer.html"></div>

  <!-- Sticky actions (your existing UI) -->
  <div class="actionbar">
    <a class="ab-btn call" href="tel:8589006163">Call</a>
    <a class="ab-btn text" href="sms:+18589006163">Text</a>
    <a class="ab-btn estimate" href="#estimate">Free Estimate</a>
  </div>
</body>
</html>
