/**
 * AGPixels Worker
 * - Handles POST /api/contact: receives the contact form, sends two emails via Resend
 * - All other paths: serves the static site from the assets binding
 */

const FROM_EMAIL = "AGPixels <noreply@agpixels.ca>";          // verified Resend sender — full SPF/DKIM/DMARC on agpixels.ca
const TO_EMAIL   = "adel.ghader@gmail.com";                    // submission notifications go here
const REPLY_TO   = "info@agpixels.ca";                        // confirmation email's reply-to
const SITE_URL   = "https://agpixels.ca";

// Anti-spam: origin gate. Direct-API spam bots usually omit / spoof Origin.
const ALLOWED_ORIGINS = new Set([
  "https://agpixels.ca",
  "https://www.agpixels.ca",
]);
const ALLOWED_REFERER_PREFIXES = [
  "https://agpixels.ca/",
  "https://www.agpixels.ca/",
];
const FORM_MIN_AGE_MS = 3 * 1000;          // submit any faster → bot
const FORM_MAX_AGE_MS = 60 * 60 * 1000;     // page rendered > 1h ago → stale/bot

// Security headers applied to every response leaving the Worker.
// HSTS preload requires the redirect + max-age >= 31536000 + includeSubDomains.
const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Force HTTPS. Cloudflare usually terminates TLS so request.url is already
    // https, but the URL header reflects the original client scheme via
    // CF-Visitor / forwarded headers. Honour an explicit http:// in the URL.
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    // Canonicalize www -> apex. Both hostnames currently resolve to this Worker,
    // which was serving identical 200s on each and splitting ranking signal.
    if (url.hostname === "www.agpixels.ca") {
      url.hostname = "agpixels.ca";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/api/contact" && request.method === "POST") {
      return withSecurityHeaders(await handleContact(request, env));
    }

    if (url.pathname === "/api/contact") {
      return withSecurityHeaders(json({ success: false, message: "Method not allowed" }, 405));
    }

    // Fall through to static assets
    const assetResponse = await env.ASSETS.fetch(request);
    return withSecurityHeaders(assetResponse);
  },
};

async function handleContact(request, env) {
  // --- Anti-spam gate 1: Origin / Referer must be agpixels.ca.
  // Bot doing curl/Python POST against /api/contact will fail this.
  const origin  = request.headers.get("Origin")  || "";
  const referer = request.headers.get("Referer") || "";
  const originOk  = ALLOWED_ORIGINS.has(origin);
  const refererOk = ALLOWED_REFERER_PREFIXES.some((p) => referer.startsWith(p));
  if (!originOk && !refererOk) {
    console.warn("Rejected /api/contact: bad origin/referer", { origin, referer });
    return json({ success: true, message: "OK" });   // silent 200 so bot doesn't iterate
  }

  // Parse body — accept JSON or form-encoded
  let data;
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }
  } catch (err) {
    return json({ success: false, message: "Invalid request body" }, 400);
  }

  // --- Anti-spam gate 2: checkbox honeypot (legacy; kept for defense in depth)
  if (data.botcheck) {
    console.warn("Rejected /api/contact: checkbox honeypot filled");
    return json({ success: true, message: "OK" });
  }

  // --- Anti-spam gate 3: text-named honeypot.
  // Bots autofill URL-shaped field names. A real user never sees these.
  if ((data.website || "").toString().trim() || (data.url || "").toString().trim()) {
    console.warn("Rejected /api/contact: text honeypot filled", { website: data.website, url: data.url });
    return json({ success: true, message: "OK" });
  }

  // --- Anti-spam gate 4: form_loaded_at — page render timestamp set by JS.
  // Missing / non-numeric / submitted in < 3s / older than 1h → bot.
  const loaded = Number(data.form_loaded_at);
  const elapsed = Date.now() - loaded;
  if (!Number.isFinite(loaded) || loaded <= 0 || elapsed < FORM_MIN_AGE_MS || elapsed > FORM_MAX_AGE_MS) {
    console.warn("Rejected /api/contact: bad form_loaded_at", { loaded, elapsed });
    return json({ success: true, message: "OK" });
  }

  // Validate required fields
  const name    = (data.name    || "").trim();
  const email   = (data.email   || "").trim();
  const phone   = (data.phone   || "").trim();
  let   message = (data.message || "").trim();
  const projectType = (data.project_type || "Not specified").trim();
  const source  = (data.source  || "contact").trim();

  if (!name || !email) {
    return json({ success: false, message: "Name and email are required" }, 400);
  }
  if (name.length    > 200)    return json({ success: false, message: "Name too long"    }, 400);
  if (email.length   > 200)    return json({ success: false, message: "Email too long"   }, 400);
  if (phone.length   > 50)     return json({ success: false, message: "Phone too long"   }, 400);
  if (message.length > 5000)   return json({ success: false, message: "Message too long" }, 400);

  // Mini-form (hero-mini) submits without a message field. Build a short
  // synthetic one so the notification email reads cleanly and Adel knows
  // which entry-point the lead came from.
  if (!message) {
    const bits = [];
    bits.push(`Quick quote request via ${source === "hero-mini" ? "hero mini-form" : source}.`);
    if (phone) bits.push(`Phone: ${phone}.`);
    bits.push(`Project type: ${projectType}.`);
    bits.push("No additional details provided. Reply directly to follow up.");
    message = bits.join(" ");
  }

  // Basic email shape check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, message: "Invalid email address" }, 400);
  }

  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return json({ success: false, message: "Email service not configured" }, 500);
  }

  // Send both emails in parallel
  const [notifyRes, confirmRes] = await Promise.allSettled([
    sendEmail(env.RESEND_API_KEY, {
      from: FROM_EMAIL,
      to: TO_EMAIL,
      reply_to: email,
      subject: `New project inquiry — ${name}${source === "hero-mini" ? " (hero mini-form)" : ""}`,
      html: notificationEmail({ name, email, phone, projectType, message, source }),
    }),
    sendEmail(env.RESEND_API_KEY, {
      from: FROM_EMAIL,
      to: email,
      reply_to: REPLY_TO,
      subject: "Thanks for reaching out — AGPixels",
      html: confirmationEmail({ name, projectType, message }),
    }),
  ]);

  // The notification to AGPixels is the critical one — if it fails, the lead is lost.
  // The confirmation to the submitter is nice-to-have.
  if (notifyRes.status === "rejected" || (notifyRes.value && !notifyRes.value.ok)) {
    console.error("Notification email failed:", notifyRes);
    return json({ success: false, message: "Could not send your message. Please email info@agpixels.ca directly." }, 502);
  }

  if (confirmRes.status === "rejected" || (confirmRes.value && !confirmRes.value.ok)) {
    // Log but still return success — AGPixels got the lead
    console.warn("Confirmation email failed:", confirmRes);
  }

  return json({ success: true, message: "Message sent" });
}

async function sendEmail(apiKey, payload) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

// ---- Email templates -----------------------------------------------------

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function notificationEmail({ name, email, phone, projectType, message, source }) {
  const safeName    = escapeHtml(name);
  const safeEmail   = escapeHtml(email);
  const safePhone   = escapeHtml(phone || "");
  const safeType    = escapeHtml(projectType);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const safeSource  = escapeHtml(source || "contact");
  const sourceLabel = safeSource === "hero-mini" ? "Hero mini-form (quick quote)" : "Full contact form";

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F0E1A;background:#fafafc;margin:0;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6e5ee;border-radius:12px;padding:28px;">
  <h2 style="margin:0 0 16px;font-size:18px;color:#6B5DF7;">New project inquiry from agpixels.ca</h2>
  <table style="width:100%;border-collapse:collapse;font-size:15px;">
    <tr><td style="padding:6px 0;color:#6B6A78;width:120px;">Name</td><td style="padding:6px 0;"><strong>${safeName}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6B6A78;">Email</td><td style="padding:6px 0;"><a href="mailto:${safeEmail}" style="color:#6B5DF7;">${safeEmail}</a></td></tr>
    ${safePhone ? `<tr><td style="padding:6px 0;color:#6B6A78;">Phone</td><td style="padding:6px 0;"><a href="tel:${safePhone}" style="color:#6B5DF7;">${safePhone}</a></td></tr>` : ""}
    <tr><td style="padding:6px 0;color:#6B6A78;">Project type</td><td style="padding:6px 0;">${safeType}</td></tr>
    <tr><td style="padding:6px 0;color:#6B6A78;">Source</td><td style="padding:6px 0;">${sourceLabel}</td></tr>
  </table>
  <h3 style="margin:24px 0 8px;font-size:14px;color:#6B6A78;text-transform:uppercase;letter-spacing:0.08em;">Message</h3>
  <div style="font-size:15px;line-height:1.55;white-space:pre-wrap;">${safeMessage}</div>
  <p style="margin-top:24px;font-size:13px;color:#6B6A78;">Reply directly to this email to respond — it'll go to ${safeName}.</p>
</div>
</body></html>`;
}

function confirmationEmail({ name, projectType, message }) {
  const safeName    = escapeHtml(name);
  const safeType    = escapeHtml(projectType);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F0E1A;background:#fafafc;margin:0;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6e5ee;border-radius:12px;padding:28px;">
  <p style="margin:0 0 16px;font-size:16px;">Hi ${safeName},</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">Thanks for reaching out to <strong style="color:#6B5DF7;">AGPixels</strong> — your project inquiry came through and we'll be in touch within one business day.</p>
  <p style="margin:0 0 8px;font-size:14px;color:#6B6A78;text-transform:uppercase;letter-spacing:0.08em;">A quick recap of what you sent</p>
  <table style="width:100%;border-collapse:collapse;font-size:15px;background:#fafafc;border-radius:8px;padding:12px;margin-bottom:16px;">
    <tr><td style="padding:8px 12px;color:#6B6A78;width:120px;">Project type</td><td style="padding:8px 12px;">${safeType}</td></tr>
    <tr><td style="padding:8px 12px;color:#6B6A78;vertical-align:top;">Message</td><td style="padding:8px 12px;line-height:1.55;white-space:pre-wrap;">${safeMessage}</td></tr>
  </table>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">If you'd like to add anything in the meantime, email <a href="mailto:info@agpixels.ca" style="color:#6B5DF7;">info@agpixels.ca</a>.</p>
  <p style="margin:0;font-size:15px;line-height:1.55;">Talk soon,<br>Adel<br><a href="${SITE_URL}" style="color:#6B5DF7;text-decoration:none;">AGPixels</a></p>
</div>
</body></html>`;
}
