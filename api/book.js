// =====================================================================
//  POST /api/book — public "work with me" application (from /book).
//  1. Stores the request (status: pending) for the admin Requests inbox.
//  2. Emails Jacob a branded "New application".
//  3. Emails the applicant a branded "Application received".
// =====================================================================
const { db } = require("./_lib/db.js");
const { sendEmail, brandedHtml, detailRow, OWNER } = require("./_lib/email.js");

const field = (v, max = 300) => String(v == null ? "" : v).trim().slice(0, max);
const escHtml = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method-not-allowed" }); return; }

  const b = req.body || {};
  // Honeypot: bots fill it, humans never see it.
  if (field(b._honey, 10)) { res.status(200).json({ ok: true }); return; }

  const f = {
    name: field(b.name, 200),
    email: field(b.email, 200),
    phone: field(b.phone, 60),
    brokerage: field(b.brokerage, 200),
    title: field(b.address, 300),
    city: field(b.city, 120),
    state: field(b.state, 10),
    zip: field(b.zip, 12),
    sqft: b.sqft ? parseInt(b.sqft, 10) || null : null,
    target_date: field(b.target_date, 10) || null,
    services: field(b.services, 1000),
    message: field(b.message, 5000),
  };
  if (!f.name || !f.title || !f.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
    res.status(400).json({ error: "missing-fields" });
    return;
  }

  try {
    const s = await db();
    const [row] = await s`
      INSERT INTO requests (name, email, phone, brokerage, title, city, state, zip, sqft, target_date, services, message)
      VALUES (${f.name}, ${f.email}, ${f.phone}, ${f.brokerage}, ${f.title}, ${f.city}, ${f.state}, ${f.zip}, ${f.sqft}, ${f.target_date}, ${f.services}, ${f.message})
      RETURNING id`;

    const loc = [f.city, [f.state, f.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    const rows =
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:2px 0 20px;">` +
      detailRow("Property", escHtml(f.title) + (loc ? "<br><span style=\"color:#8a94a6\">" + escHtml(loc) + "</span>" : "")) +
      (f.sqft ? detailRow("Sqft", Number(f.sqft).toLocaleString()) : "") +
      (f.target_date ? detailRow("Target", escHtml(f.target_date)) : "") +
      (f.services ? detailRow("Services", escHtml(f.services)) : "") +
      detailRow("Contact", escHtml(f.email) + (f.phone ? " · " + escHtml(f.phone) : "")) +
      (f.brokerage ? detailRow("Brokerage", escHtml(f.brokerage)) : "") +
      `</table>`;

    // ---- to Jacob -----------------------------------------------------
    await sendEmail({
      to: OWNER,
      replyTo: f.email,
      subject: `New application — ${f.title}${f.name ? " · " + f.name : ""}`,
      text: `New application from ${f.name} (${f.email}) for ${f.title}.\n\n${f.message}`,
      html: brandedHtml({
        eyebrowText: "New application",
        headline: escHtml(f.name),
        bodyHtml: rows +
          (f.message ? `<div style="background:#f6f4ef;padding:18px 20px;font-size:14.5px;line-height:1.7;white-space:pre-line;">${escHtml(f.message)}</div>` : ""),
        cta: { label: "Review in admin", url: "https://www.jacobcschrader.com/admin#requests" },
      }),
    });

    // ---- to applicant (best effort) ------------------------------------
    try {
      await sendEmail({
        to: f.email,
        replyTo: OWNER,
        subject: "Application received — Jacob Schrader",
        text: `Hi ${f.name},\n\nThank you — your application for ${f.title} has been received. ` +
          "I review every request personally and will reply within 24 hours.\n\n— Jacob Schrader · jacobcschrader.com",
        html: brandedHtml({
          eyebrowText: "Application received",
          headline: "Thank you — I have your request.",
          bodyHtml:
            `<p style="margin:0 0 14px;">Hi ${escHtml(f.name)},</p>` +
            `<p style="margin:0 0 14px;">Your application for <b>${escHtml(f.title)}</b> has been received. ` +
            `I review every request personally and will reply within 24&nbsp;hours with availability and a custom quote.</p>` +
            `<p style="margin:0;">In the meantime, recent work is below.</p>`,
          cta: { label: "View the work", url: "https://www.jacobcschrader.com/projects" },
        }),
      });
    } catch (e) { /* applicant email is best-effort */ }

    res.status(200).json({ ok: true, id: row.id });
  } catch (e) {
    const msg = /DATABASE_URL/.test(String(e)) ? "db-not-configured"
      : /RESEND_API_KEY|Resend error/.test(String(e)) ? "send-failed" : "error";
    res.status(502).json({ error: msg });
  }
};
