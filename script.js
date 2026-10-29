/* ==========================================================================
   Thriving Talents Learning Platform — landing page behaviour
   Vanilla JS, no dependencies. Reads window.TT_CONFIG from config.js.
   ========================================================================== */
(function () {
  'use strict';
  var cfg = window.TT_CONFIG || {};

  /* ---------- Analytics ---------- */
  function loadGA4(id) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
  }
  function loadVercel() {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var s = document.createElement('script');
    s.defer = true;
    s.src = '/_vercel/insights/script.js';
    document.head.appendChild(s);
  }
  if (cfg.ga4Id) loadGA4(cfg.ga4Id);
  if (cfg.vercelAnalytics) loadVercel();

  // One call, fans out to whichever providers are loaded. Page view is automatic
  // in both GA4 and Vercel; the custom events below are the PRD's three.
  function track(name, params) {
    params = params || {};
    try { if (window.gtag) window.gtag('event', name, params); } catch (e) {}
    try { if (window.va) window.va('event', { name: name, data: params }); } catch (e) {}
    if (cfg.emailProvider === 'none' && window.console) console.info('[track]', name, params);
  }

  /* ---------- Config-driven bits ---------- */
  if (cfg.frntlneLogo) {
    document.querySelectorAll('[data-cobrand] .cobrand-logo').forEach(function (img) {
      img.src = cfg.frntlneLogo;
    });
  }
  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- Scroll depth (50%, 100%), fired once each ---------- */
  var fired = { 50: false, 100: false };
  function checkDepth() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    var pct = ((window.scrollY || doc.scrollTop) / max) * 100;
    [50, 100].forEach(function (m) {
      if (!fired[m] && pct >= m - 0.5) { fired[m] = true; track('scroll_depth', { percent: m }); }
    });
  }
  window.addEventListener('scroll', checkDepth, { passive: true });
  window.addEventListener('load', checkDepth);

  /* ---------- Where the visitor came from ---------- */
  // Print separate QR codes with ?src=booth, ?src=talk and so on, and every
  // signup records which one was scanned. Costs the visitor nothing. Nothing
  // here is shown to the visitor; it only tags the row in the sheet.
  var qrSource = (function () {
    try {
      var fromUrl = new URLSearchParams(location.search).get('src');
      if (fromUrl) sessionStorage.setItem('tt_src', fromUrl);
      return fromUrl || sessionStorage.getItem('tt_src') || '';
    } catch (e) { return ''; }
  })();

  /* ---------- Email capture ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^\+?[\d\s().-]{8,20}$/;
  // Per-form settings live on the form element, so the same script drives
  // both the early-access page and event pages. Each falls back to the
  // early-access value, which keeps that page's behaviour unchanged.
  //   data-label      submit button text
  //   data-campaign   tags the row; the Apps Script routes on it
  //   data-email-msg  shown when the email is left empty
  //   data-fail-msg   shown when the submit fails
  //   data-open-key   config.js flag; false swaps the form for [data-closed]
  // Inputs marked data-field are sent as extra fields; data-required makes
  // them mandatory and data-kind="phone" checks the shape of a number.
  function opt(form, attr, fallback) { return form.getAttribute(attr) || fallback; }
  var forms = [].slice.call(document.querySelectorAll('[data-capture-form]'));

  forms = forms.filter(function (form) {
    var key = form.getAttribute('data-open-key');
    if (!key || cfg[key] !== false) return true;
    form.hidden = true;
    var closed = document.querySelector('[data-closed]');
    if (closed) closed.hidden = false;
    return false;
  });
  var sticky = document.getElementById('sticky-cta');

  function panelFor(form) { return document.getElementById(form.getAttribute('data-thanks')); }

  /* Sticky mobile CTA: visible only while the hero form is off screen. */
  if (sticky && forms[0] && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      sticky.hidden = entries[0].isIntersecting || forms[0].hidden;
    }, { threshold: 0 }).observe(forms[0]);
  }

  function showError(form, msg, field) {
    var err = form.querySelector('.error');
    err.textContent = msg;
    err.hidden = !msg;
    form.querySelectorAll('.capture-field').forEach(function (el) {
      el.setAttribute('aria-invalid', msg && el === field ? 'true' : 'false');
    });
    if (msg && field) field.focus();
  }

  function setBusy(form, busy) {
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = busy;
    btn.textContent = busy ? 'Sending\u2026' : opt(form, 'data-label', 'Claim my place');
  }

  // Registering once covers the whole page, so every form flips to its
  // thank-you panel — not just the one that was submitted.
  function showThanks(submitted) {
    forms.forEach(function (f) {
      f.hidden = true;
      var panel = panelFor(f);
      if (panel) panel.hidden = false;
    });
    // the closing section's "leave your email" pitch no longer applies
    var intro = document.querySelector('[data-closing-intro]');
    if (intro) intro.hidden = true;
    if (sticky) sticky.hidden = true;
    var first = (submitted.querySelector('input[name="NAME"]').value || '').trim().split(/\s+/)[0];
    document.querySelectorAll('[data-thanks-name]').forEach(function (el) {
      el.textContent = first ? ', ' + first : '';
    });
    var focusTarget = panelFor(submitted);
    if (focusTarget) focusTarget.focus();
    try { history.replaceState(null, '', '#thanks'); } catch (e) {}
  }

  // Mailchimp only allows cross-origin submits via JSONP on the post-json endpoint.
  function submitMailchimp(name, email) {
    return new Promise(function (resolve, reject) {
      var action = cfg.mailchimpAction.replace('/post?', '/post-json?');
      var cb = 'mc_cb_' + Date.now();
      var timer = setTimeout(function () { cleanup(); reject(new Error('timeout')); }, 12000);
      function cleanup() { clearTimeout(timer); delete window[cb]; if (s.parentNode) s.parentNode.removeChild(s); }
      window[cb] = function (res) {
        cleanup();
        if (res && res.result === 'success') resolve();
        else if (res && /already subscribed/i.test(res.msg || '')) resolve(); // treat as success
        else reject(new Error((res && res.msg) ? res.msg.replace(/<[^>]+>/g, '') : 'Subscription failed'));
      };
      var s = document.createElement('script');
      s.src = action + '&EMAIL=' + encodeURIComponent(email) +
        '&FNAME=' + encodeURIComponent(name) +
        '&SOURCE=ASAH&QRSOURCE=' + encodeURIComponent(qrSource) + '&c=' + cb;
      s.onerror = function () { cleanup(); reject(new Error('network')); };
      document.head.appendChild(s);
    });
  }

  // Brevo's hosted form endpoint accepts a plain form POST. It doesn't send CORS
  // headers, so we post opaquely and trust the 2xx (the confirmation email is
  // configured on the Brevo side).
  function submitBrevo(name, email) {
    var fd = new FormData();
    fd.append('EMAIL', email);
    fd.append('FIRSTNAME', name);
    fd.append('SOURCE', 'ASAH');
    fd.append('QRSOURCE', qrSource);
    fd.append('email_address_check', ''); // Brevo honeypot
    fd.append('locale', 'en');
    return fetch(cfg.brevoAction, { method: 'POST', mode: 'no-cors', body: fd }).then(function () {});
  }

  // Google Sheets via an Apps Script web app. A text/plain body keeps this a
  // "simple" request, so the browser skips the CORS preflight that Apps Script
  // cannot answer.
  function submitSheet(name, email, location, campaign, fields) {
    var payload = JSON.stringify({
      name: name,
      email: email,
      source: campaign,
      qrSource: qrSource,
      location: location,
      fields: fields,
      token: cfg.sheetsToken || ''
    });
    var opts = {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload
    };
    return fetch(cfg.sheetsEndpoint, opts).then(function (r) {
      return r.text();
    }).then(function (text) {
      var res = null;
      try { res = JSON.parse(text); } catch (e) {}
      // Only a reply that explicitly rejects the row counts as a failure.
      if (res && res.ok === false) throw new Error(res.error || 'rejected');
    }, function () {
      // fetch itself failed, which is either a real network problem or the
      // browser refusing to let us read a reply that did arrive. Send it again
      // opaquely rather than telling someone their address was not saved; the
      // script keeps one row per address, so a duplicate cannot land.
      return fetch(cfg.sheetsEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload
      }).then(function () {});
    });
  }

  function submitDemo() {
    return new Promise(function (resolve) { setTimeout(resolve, 600); });
  }

  forms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = form.querySelector('input[name="NAME"]');
      var input = form.querySelector('input[type="email"]');
      var name = (nameInput.value || '').trim().replace(/\s+/g, ' ');
      var email = (input.value || '').trim();
      if (form.querySelector('input[name="hp"]').value) return; // bot
      if (name.length < 2) return showError(form, 'Enter your name so we know who to write to.', nameInput);
      if (!email) return showError(form, opt(form, 'data-email-msg', 'Enter your work email to claim a place.'), input);
      if (!EMAIL_RE.test(email)) return showError(form, 'That email doesn\'t look right. Check for typos and try again.', input);

      var fields = {};
      var extras = [].slice.call(form.querySelectorAll('[data-field]'));
      for (var i = 0; i < extras.length; i++) {
        var el = extras[i];
        var v = (el.value || '').trim().replace(/\s+/g, ' ');
        if (el.hasAttribute('data-required') && !v) return showError(form, el.getAttribute('data-required'), el);
        if (v && el.getAttribute('data-kind') === 'phone' && !PHONE_RE.test(v)) {
          return showError(form, 'That number doesn\'t look right. Include the area or mobile prefix, e.g. 012-345 6789.', el);
        }
        fields[el.name] = v;
      }
      showError(form, '');
      setBusy(form, true);

      var where = form.getAttribute('data-location') || 'unknown';
      var campaign = opt(form, 'data-campaign', 'ASAH');
      var send;
      if (cfg.emailProvider === 'sheets' && cfg.sheetsEndpoint) send = submitSheet(name, email, where, campaign, fields);
      else if (cfg.emailProvider === 'mailchimp' && cfg.mailchimpAction) send = submitMailchimp(name, email);
      else if (cfg.emailProvider === 'brevo' && cfg.brevoAction) send = submitBrevo(name, email);
      else send = submitDemo();

      send.then(function () {
        track('email_capture', {
          provider: cfg.emailProvider || 'none',
          location: where,
          campaign: campaign,
          qr_source: qrSource || 'direct'
        });
        showThanks(form);
      }).catch(function (err) {
        setBusy(form, false);
        showError(form, opt(form, 'data-fail-msg', 'We couldn\'t save that just now. Please try again, or email sales@thrivingtalents.com and we\'ll sign you up.'), input);
        track('email_capture_error', { message: String(err && err.message || err) });
      });
    });
  });
})();
