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

// Contact form — AJAX submission to Web3Forms
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');
  const submit = form.querySelector('.form-submit');
  const originalLabel = submit.textContent;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic native validity check
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sending…';
    status.className = 'form-status';
    status.textContent = '';

    try {
      const data = Object.fromEntries(new FormData(form).entries());
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
        status.className = 'form-status ok';
        status.textContent = "Thanks — we got your message and will reply within one business day. Check your inbox for a confirmation.";

        // Fire Google Ads conversion event (with Enhanced Conversions data)
        // gtag.js hashes the email client-side before transmission.
        if (typeof window.gtag === 'function') {
          // Pass user data first so it's available for Enhanced Conversions matching
          window.gtag('set', 'user_data', {
            email: (data.email || '').trim().toLowerCase(),
          });

          window.gtag('event', 'conversion', {
            send_to: 'AW-18121549088/qKS5CL-omKMcEKDKg8FD',
          });

          // Also fire a GA4 generate_lead event for analytics reporting
          window.gtag('event', 'generate_lead', {
            event_category: 'contact',
            event_label: 'contact_form_submit',
          });
        }

        form.reset();
      } else {
        throw new Error(json.message || 'Submission failed');
      }
    } catch (err) {
      status.className = 'form-status error';
      status.textContent = (err && err.message) || "Sorry — that didn't go through. Please email us directly at info@agpixels.ca.";
      console.error('Contact form error:', err);
    } finally {
      submit.disabled = false;
      submit.textContent = originalLabel;
    }
  });
})();
