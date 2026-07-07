// =====================================================================
//  EMAIL — the one place all site email goes through (Resend).
//
//  Any current or future serverless function that needs to send email
//  should import { sendEmail } from here — never call Resend directly.
//
//  Env vars (Vercel → Settings → Environment Variables):
//    RESEND_API_KEY  required — from resend.com/api-keys
//    CONTACT_TO      where enquiries land   (default jacxbschrader@gmail.com)
//    CONTACT_FROM    the sender identity    (default onboarding@resend.dev)
//
//  ⚠️ To email ANYONE other than the account owner (e.g. the auto-reply
//  to an enquirer), the domain must be verified at resend.com/domains,
//  and CONTACT_FROM set to it, e.g.:
//    CONTACT_FROM = Jacob Schrader <enquiry@jacobcschrader.com>
//
//  (The _lib folder is underscore-prefixed so Vercel does not expose
//  this file as an endpoint.)
// =====================================================================

const FROM = process.env.CONTACT_FROM || "Jacob Schrader <onboarding@resend.dev>";
const OWNER = process.env.CONTACT_TO || "jacxbschrader@gmail.com";

async function sendEmail({ to, subject, text, html, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");

  const payload = { from: FROM, to: Array.isArray(to) ? to : [to], subject };
  if (text) payload.text = text;
  if (html) payload.html = html;
  if (replyTo) payload.reply_to = replyTo;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    throw new Error(`Resend error ${r.status}: ${await r.text().catch(() => "")}`);
  }
  return r.json();
}

// Shared brand wrapper for outbound HTML emails — navy + serif, matching
// the site. Keep emails simple: inline styles only, single column.
function brandedHtml({ headline, bodyHtml }) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;">
        <tr><td style="background:#0f2240;padding:28px 40px;text-align:center;">
          <span style="font-style:italic;font-weight:300;font-size:28px;color:#ffffff;letter-spacing:2px;">JCS</span>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 18px;font-weight:400;font-style:italic;font-size:24px;color:#0f2240;">${headline}</h1>
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#16233b;">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #e8e5de;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#5d6a7e;text-align:center;">
          Jacob Schrader · Real Estate · Architecture · Design<br>
          <a href="https://www.jacobcschrader.com" style="color:#0f2240;">jacobcschrader.com</a> ·
          <a href="mailto:jacxbschrader@gmail.com" style="color:#0f2240;">jacxbschrader@gmail.com</a> ·
          (408) 824-8719
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = { sendEmail, brandedHtml, FROM, OWNER };
