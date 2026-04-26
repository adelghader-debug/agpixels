/**
 * AGPixels Worker
 * - Handles POST /api/contact: receives the contact form, sends two emails via Resend
 * - All other paths: serves the static site from the assets binding
 */

const FROM_EMAIL = "AGPixels <noreply@agpixels.ca>";          // verified Resend sender — full SPF/DKIM/DMARC on agpixels.ca
const TO_EMAIL   = "adel.ghader@gmail.com";                    // submission notifications go here
const REPLY_TO   = "info@agpixels.ca";                        // confirmation email's reply-to
const SITE_URL   = "https://agpixels.ca";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContact(request, env);
    }

    if (url.pathname === "/api/contact") {
      return json({ success: false, message: "Method not allowed" }, 405);
    }

    // Fall through to static assets
    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
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

  // Honeypot — if filled, silently "succeed" so bot doesn't retry
  if (data.botcheck) {
    return json({ success: true, message: "OK" });
  }

  // Validate required fields
  const name    = (data.name    || "").trim();
  const email   = (data.email   || "").trim();
  const message = (data.message || "").trim();
  const projectType = (data.project_type || "Not specified").trim();

  if (!name || !email || !message) {
    return json({ success: false, message: "Name, email, and message are required" }, 400);
  }
  if (name.length    > 200)    return json({ success: false, message: "Name too long"    }, 400);
  if (email.length   > 200)    return json({ success: false, message: "Email too long"   }, 400);
  if (message.length > 5000)   return json({ success: false, message: "Message too long" }, 400);

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
      subject: `New project inquiry — ${name}`,
      html: notificationEmail({ name, email, projectType, message }),
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

function notificationEmail({ name, email, projectType, message }) {
  const safeName    = escapeHtml(name);
  const safeEmail   = escapeHtml(email);
  const safeType    = escapeHtml(projectType);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F0E1A;background:#fafafc;margin:0;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6e5ee;border-radius:12px;padding:28px;">
  <h2 style="margin:0 0 16px;font-size:18px;color:#6B5DF7;">New project inquiry from agpixels.ca</h2>
  <table style="width:100%;border-collapse:collapse;font-size:15px;">
    <tr><td style="padding:6px 0;color:#6B6A78;width:120px;">Name</td><td style="padding:6px 0;"><strong>${safeName}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6B6A78;">Email</td><td style="padding:6px 0;"><a href="mailto:${safeEmail}" style="color:#6B5DF7;">${safeEmail}</a></td></tr>
    <tr><td style="padding:6px 0;color:#6B6A78;">Project type</td><td style="padding:6px 0;">${safeType}</td></tr>
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
