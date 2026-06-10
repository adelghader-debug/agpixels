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

// Contact form(s) · AJAX submission to /api/contact
// Now handles every form.contact-form on the page identically (full form +
// hero mini-form), so both fire the same Google Ads conversion event.
(function () {
  const forms = document.querySelectorAll('form.contact-form');
  if (!forms.length) return;

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
