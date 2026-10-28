// Mobile nav toggle
(function () {
  const toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach(link => {
      link.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

// Auto-update footer year
(function () {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

// Sticky CTA · show once user has scrolled past the hero
(function () {
  const cta = document.querySelector('.sticky-cta');
  const hero = document.querySelector('.hero');
  if (!cta || !hero) return;

  const onScroll = () => {
    const heroBottom = hero.offsetTop + hero.offsetHeight - 100;
    const contactSection = document.getElementById('contact');
    const contactTop = contactSection ? contactSection.offsetTop : Infinity;
    const scrolled = window.scrollY;

    // Show after scrolling past hero, hide when contact section is in view
    const shouldShow = scrolled > heroBottom && scrolled < contactTop - 200;
    cta.classList.toggle('is-visible', shouldShow);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// Meta Pixel + Conversions API · builds the retargeting audience for Meta ads.
// Each event goes to Meta twice with the same event id: from the browser
// (fbevents.js) and from our Worker (/api/meta, or /api/contact for leads), so
// visits still count when an ad blocker stops fbevents.js, and Meta keeps one copy.
// Off while META_PIXEL_ID is empty, on mockup previews, and for visitors whose
// browser sends Global Privacy Control. Keep the id in sync with src/index.js.
(function () {
  const META_PIXEL_ID = '1099484986224377';
  if (!META_PIXEL_ID || navigator.globalPrivacyControl === true || location.pathname.startsWith('/preview/')) return;

  const cookie = (name) => (document.cookie.match('(?:^|; )' + name + '=([^;]*)') || [])[1] || '';
  const setCookie = (name, value) => { document.cookie = name + '=' + value + '; Max-Age=7776000; Path=/; SameSite=Lax; Secure'; };
  // Meta's browser id (_fbp) and ad click id (_fbc). Created here so server
  // events carry them even when fbevents.js is blocked; fbevents.js reuses them.
  if (!cookie('_fbp')) setCookie('_fbp', 'fb.1.' + Date.now() + '.' + Math.floor(Math.random() * 2147483647));
  const params = new URLSearchParams(location.search);
  const fbclid = params.get('fbclid');
  if (fbclid && !cookie('_fbc').endsWith('.' + fbclid)) setCookie('_fbc', 'fb.1.' + Date.now() + '.' + fbclid);
  // Open any page with ?meta_test=TEST12345 (the code from Events Manager > Test
  // events) to send this session's server events to the test tab.
  let testCode = '';
  try {
    if (/^TEST\w{1,20}$/.test(params.get('meta_test') || '')) sessionStorage.setItem('agpx_meta_test', params.get('meta_test'));
    testCode = sessionStorage.getItem('agpx_meta_test') || '';
  } catch (_) {}

  // The standard fbq queue. fbevents.js itself (about 200 KB) loads on the
  // visitor's first scroll, tap or key press, so it never weighs on the first
  // paint or the page speed score; queued events are sent when it arrives. The
  // Worker's copy of the page view goes out straight away regardless.
  const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
  fbq('init', META_PIXEL_ID);
  const firstTouch = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
  let pixelRequested = false;
  const loadPixel = () => {
    if (pixelRequested) return;
    pixelRequested = true;
    firstTouch.forEach((type) => window.removeEventListener(type, loadPixel));
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  };
  firstTouch.forEach((type) => window.addEventListener(type, loadPixel, { passive: true }));

  const newId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));
  window.agpMeta = { newId, testCode };

  const pageView = newId();
  fbq('track', 'PageView', {}, { eventID: pageView });
  const beacon = JSON.stringify({ event_name: 'PageView', event_id: pageView, url: location.href, test: testCode });
  if (!(navigator.sendBeacon && navigator.sendBeacon('/api/meta', new Blob([beacon], { type: 'application/json' })))) {
    fetch('/api/meta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: beacon, keepalive: true }).catch(() => {});
  }
})();

// Contact form(s) · AJAX submission to /api/contact
// Now handles every form.contact-form on the page identically (full form +
// hero mini-form), so both fire the same Google Ads conversion event.
(function () {
  const forms = document.querySelectorAll('form.contact-form');
  if (!forms.length) return;


  // --- Lead attribution -------------------------------------------------
  // Record how this visitor arrived (ad click id, UTMs, referring host,
  // landing path) once per session, so it survives internal navigation
  // between a landing page and the contact form further down the site.
  function captureAttribution() {
    try {
      const KEY = 'agpx_attr';
      const stored = sessionStorage.getItem(KEY);
      if (stored) return stored;
      const params = new URLSearchParams(location.search);
      const bits = [];
      const click = params.get('gclid') || params.get('wbraid') || params.get('gbraid');
      if (click) bits.push('gclid=' + click.slice(0, 120));
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((k) => {
        const v = params.get(k);
        if (v) bits.push(k + '=' + v.slice(0, 60));
      });
      let ref = '';
      try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (_) {}
      if (ref && ref !== location.hostname) bits.push('ref=' + ref);
      else if (!ref) bits.push('ref=direct');
      bits.push('landing=' + location.pathname.slice(0, 80));
      const value = bits.join(' | ').slice(0, 400);
      try { sessionStorage.setItem(KEY, value); } catch (_) {}
      return value;
    } catch (_) {
      return '';
    }
  }

  forms.forEach((form) => {
    const status = form.querySelector('.form-status');
    const submit = form.querySelector('.form-submit');
    if (!submit) return;
    const originalLabel = submit.textContent;
    const source = form.querySelector('input[name="source"]')?.value || 'contact';

    // Anti-spam: stamp the page load time on the form. Worker requires it to
    // be present, numeric, and 3s..1h old. Direct-API POSTers can't set this
    // unless they first GET and parse the page.
    const loadedAt = form.querySelector('input[name="form_loaded_at"]');
    if (loadedAt) loadedAt.value = String(Date.now());

    // Stamp how the visitor got here so the notification email can report it.
    const attrField = form.querySelector('input[name="attribution"]');
    if (attrField) attrField.value = captureAttribution();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Basic native validity check
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Sending…';
      if (status) {
        status.className = 'form-status';
        status.textContent = '';
      }

      try {
        const data = Object.fromEntries(new FormData(form).entries());
        // Meta: the Worker sends this lead to the Conversions API under the same
        // id as the browser Lead event below, so Meta counts it once.
        const metaLead = window.agpMeta ? window.agpMeta.newId() : '';
        if (metaLead) {
          data.meta_event_id = metaLead;
          data.meta_test = window.agpMeta.testCode;
        }
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        const json = await res.json();

        if (res.ok && json.success) {
          if (status) {
            status.className = 'form-status ok';
            status.textContent = "Thanks, we got your message and will reply within one business day. Check your inbox for a confirmation.";
          }

          // Fire Google Ads conversion event (with Enhanced Conversions data)
          // gtag.js hashes the email client-side before transmission.
          if (typeof window.gtag === 'function') {
            // Pass user data first so it's available for Enhanced Conversions matching
            window.gtag('set', 'user_data', {
              email: (data.email || '').trim().toLowerCase(),
              phone_number: (data.phone || '').trim(),
            });

            window.gtag('event', 'conversion', {
              send_to: 'AW-18121549088/qKS5CL-omKMcEKDKg8FD',
            });

            // Also fire a GA4 generate_lead event tagged with the form source
            window.gtag('event', 'generate_lead', {
              event_category: 'contact',
              event_label: source,
            });
          }

          if (metaLead && typeof window.fbq === 'function') {
            window.fbq('track', 'Lead', { content_name: source }, { eventID: metaLead });
          }

          form.reset();
        } else {
          throw new Error(json.message || 'Submission failed');
        }
      } catch (err) {
        if (status) {
          status.className = 'form-status error';
          status.textContent = (err && err.message) || "Sorry, that didn't go through. Please email us directly at info@agpixels.ca.";
        }
        console.error('Contact form error:', err);
      } finally {
        submit.disabled = false;
        submit.textContent = originalLabel;
      }
    });
  });
})();
