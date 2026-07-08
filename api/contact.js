// =====================================================================
//  CONTACT FORM  (Vercel serverless function — Resend only)
//
//  1. Emails the enquiry to Jacob (reply-to = the enquirer, so replying
//     in the inbox goes straight back to them).
//  2. Sends the enquirer a branded confirmation ("I reply within 24
//     hours"). Non-fatal if it fails — the enquiry itself already
//     reached Jacob. NOTE: the auto-reply only delivers once the domain
//     is verified in Resend (see api/_lib/email.js).
//
//  All email goes through api/_lib/email.js — add future email types
//  there, not here.
// =====================================================================

const { sendEmail, brandedHtml, detailRow, SANS, INK, PAPER_WARM, NAVY, OWNER } = require("./_lib/email.js");

const escHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method-not-allowed" });
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

  // 1) The enquiry itself — this one must succeed.
  try {
    await sendEmail({
      to: OWNER,
      replyTo: email,
      subject: `New enquiry — ${name}${type ? " · " + type : ""}`,
      text: [
        `Name:    ${name}`,
        `Email:   ${email}`,
        phone ? `Phone:   ${phone}` : null,
        type ? `Type:    ${type}` : null,
        "",
        message,
      ].filter(Boolean).join("\n"),
      html: brandedHtml({
        eyebrowText: "New enquiry",
        headline: escHtml(name),
        bodyHtml:
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:2px 0 22px;">` +
          detailRow("Email", `<a href="mailto:${escHtml(email)}" style="color:${NAVY};">${escHtml(email)}</a>`) +
          (phone ? detailRow("Phone", escHtml(phone)) : "") +
          (type ? detailRow("Type", escHtml(type)) : "") +
          `</table>` +
          `<div style="background:${PAPER_WARM};padding:20px 22px;font-family:${SANS};font-size:14.5px;line-height:1.7;color:${INK};white-space:pre-line;">${escHtml(message)}</div>` +
          `<p style="margin:18px 0 0;font-size:12.5px;color:#8a94a6;">Reply to this email to answer ${escHtml(name)} directly.</p>`,
      }),
    });
  } catch (e) {
    res.status(502).json({ error: "send-failed" });
    return;
  }

  // 2) Branded confirmation to the enquirer — best effort.
  try {
    await sendEmail({
      to: email,
      replyTo: OWNER,
      subject: "Thank you for your enquiry — Jacob Schrader",
      text:
        `Hi ${name},\n\n` +
        "Thank you for your enquiry — it's been received, and I reply " +
        "personally, usually within 24 hours.\n\n" +
        "If it's time-sensitive, you can reach me directly at " +
        "jacxbschrader@gmail.com or (408) 824-8719.\n\n" +
        "— Jacob Schrader\njacobcschrader.com",
      html: brandedHtml({
        eyebrowText: "Enquiry received",
        headline: "Thank you for your enquiry.",
        bodyHtml:
          `<p style="margin:0 0 14px;">Hi ${escHtml(name)},</p>` +
          `<p style="margin:0 0 14px;">Your enquiry has been received — I reply personally, usually within 24&nbsp;hours.</p>` +
          `<p style="margin:0;">If it's time-sensitive, reach me directly at <a href="mailto:jacxbschrader@gmail.com" style="color:#0f2240;">jacxbschrader@gmail.com</a> or (408)&nbsp;824-8719.</p>`,
        cta: { label: "View the work", url: "https://www.jacobcschrader.com/projects" },
      }),
    });
  } catch (e) {
    // Enquiry already delivered — never fail the request over the auto-reply.
  }

  res.status(200).json({ ok: true });
};
