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

// ---------------------------------------------------------------------
//  Brand system for outbound email — mirrors styles.css:
//  Cormorant Garamond (display, italic) + Inter (body), navy #0f2240 on
//  paper white, warm #f6f4ef backdrop, thin hairline rules, eyebrow
//  labels in tracked-out uppercase. Web fonts render in Apple Mail &
//  most clients; Gmail falls back to Georgia/Helvetica gracefully.
// ---------------------------------------------------------------------
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Inter', Helvetica, Arial, sans-serif";
const NAVY = "#0f2240";
const INK = "#16233b";
const MUTED = "#5d6a7e";
const PAPER_WARM = "#f6f4ef";
const LINE = "#e6e3db";

// Small helpers other emails can reuse -------------------------------
const eyebrow = (label, color = MUTED) =>
  `<div style="font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${color};">${label}</div>`;

const button = (label, url) =>
  `<a href="${url}" style="display:inline-block;background:${NAVY};color:#ffffff;font-family:${SANS};font-size:12px;font-weight:500;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 32px;">${label}</a>`;

function brandedHtml({ eyebrowText, headline, bodyHtml, cta }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background:${PAPER_WARM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER_WARM};padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;">

        <!-- Navy masthead: JCS monogram (Cormorant italic light) + descriptor -->
        <tr><td style="background:${NAVY};padding:34px 40px 30px;text-align:center;">
          <div style="font-family:${SERIF};font-style:italic;font-weight:300;font-size:34px;line-height:1;color:#ffffff;letter-spacing:1px;">JCS</div>
          <div style="margin-top:12px;font-family:${SANS};font-size:10px;font-weight:400;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.62);">Real Estate &nbsp;·&nbsp; Architecture &nbsp;·&nbsp; Design</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:44px 44px 40px;">
          ${eyebrowText ? eyebrow(eyebrowText) + '<div style="height:14px;"></div>' : ""}
          <h1 style="margin:0 0 18px;font-family:${SERIF};font-style:italic;font-weight:400;font-size:27px;line-height:1.25;color:${NAVY};">${headline}</h1>
          <div style="font-family:${SANS};font-weight:400;font-size:14.5px;line-height:1.7;color:${INK};">${bodyHtml}</div>
          ${cta ? `<div style="margin-top:28px;">${button(cta.label, cta.url)}</div>` : ""}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:26px 44px 30px;border-top:1px solid ${LINE};text-align:center;">
          <div style="font-family:${SERIF};font-style:italic;font-weight:300;font-size:19px;color:${NAVY};">JCS</div>
          <div style="margin-top:10px;font-family:${SANS};font-size:11.5px;line-height:1.8;color:${MUTED};">
            <a href="https://www.jacobcschrader.com" style="color:${NAVY};text-decoration:none;">jacobcschrader.com</a>
            &nbsp;·&nbsp; <a href="mailto:jacxbschrader@gmail.com" style="color:${NAVY};text-decoration:none;">jacxbschrader@gmail.com</a>
            &nbsp;·&nbsp; (408)&nbsp;824-8719<br>
            <span style="letter-spacing:1.5px;">Based in Diablo, CA — available worldwide.</span>
          </div>
        </td></tr>

      </table>
      <div style="max-width:560px;margin-top:18px;font-family:${SANS};font-size:10.5px;letter-spacing:1px;color:#a9a49a;text-align:center;">© ${new Date().getFullYear()} Jacob Schrader</div>
    </td></tr>
  </table>
</body>
</html>`;
}

// A labelled row for detail tables (used by the enquiry notification) --
const detailRow = (label, valueHtml) =>
  `<tr>
    <td style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:${SANS};font-size:10.5px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${MUTED};width:96px;vertical-align:top;">${label}</td>
    <td style="padding:9px 0 9px 14px;border-bottom:1px solid ${LINE};font-family:${SANS};font-size:14px;color:${INK};">${valueHtml}</td>
  </tr>`;

module.exports = {
  sendEmail, brandedHtml, detailRow, eyebrow, button,
  SERIF, SANS, NAVY, INK, MUTED, PAPER_WARM, LINE,
  FROM, OWNER,
};
