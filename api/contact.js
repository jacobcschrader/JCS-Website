// =====================================================================
//  CONTACT FORM → RESEND  (Vercel serverless function)
//
//  Receives the enquiry from contact.html as JSON and emails it via
//  Resend (resend.com). Setup (one time, in the Vercel dashboard):
//
//    1. Create a Resend account and an API key (resend.com/api-keys).
//    2. Vercel → Project → Settings → Environment Variables:
//         RESEND_API_KEY = re_xxxxxxxx        (required)
//         CONTACT_TO     = jacob@thevisaro.com (optional, this is default)
//         CONTACT_FROM   = JCS Website <enquiry@jacobcschrader.com>
//                          (optional — only after verifying the domain at
//                           resend.com/domains; until then the default
//                           onboarding@resend.dev sender is used)
//    3. Redeploy.
//
//  Until RESEND_API_KEY is set this returns 503 and the form on
//  contact.html automatically falls back to FormSubmit — enquiries are
//  never lost either way.
// =====================================================================

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Not configured yet — the client falls back to FormSubmit.
    res.status(503).json({ error: "not-configured" });
    return;
  }

  const b = req.body || {};
  const field = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
  const name = field(b.name, 200);
  const email = field(b.email, 200);
  const phone = field(b.phone, 60);
  const type = field(b.type, 100);
  const message = field(b.message, 5000);

  // Honeypot filled → bot. Pretend success so it learns nothing.
  if (field(b._honey, 10)) {
    res.status(200).json({ ok: true });
    return;
  }
  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "missing-fields" });
    return;
  }

  const text = [
    `Name:    ${name}`,
    `Email:   ${email}`,
    phone ? `Phone:   ${phone}` : null,
    type ? `Type:    ${type}` : null,
    "",
    message,
  ].filter(Boolean).join("\n");

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || "JCS Website <onboarding@resend.dev>",
        to: [process.env.CONTACT_TO || "jacob@thevisaro.com"],
        reply_to: email, // hit Reply in your inbox to answer the enquirer
        subject: `New enquiry — ${name}${type ? " · " + type : ""}`,
        text,
      }),
    });
    if (!r.ok) {
      res.status(502).json({ error: "send-failed" });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: "send-failed" });
  }
};
