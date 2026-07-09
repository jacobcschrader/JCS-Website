// =====================================================================
//  POST /api/admin/deliver { id } — send (or resend) a delivery:
//    1. Issues a delivery token on first send (powers /delivery?t=…).
//    2. Emails the client a branded "Your delivery is ready" with a
//       button to the JCS delivery page.
//    3. Stamps delivery_sent_at, increments delivery_sends, sets
//       delivered_at, and advances the stage to 'delivered' if the
//       project is still earlier in the pipeline.
//  Requires a client with an email and a gallery link on the project.
// =====================================================================
const crypto = require("node:crypto");
const { requireAuth } = require("../auth.js");
const { db } = require("../db.js");
const { linksOf, recipientsOf } = require("../links.js");
const { sendEmail, brandedHtml, OWNER } = require("../email.js");

const escHtml = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") { res.status(405).json({ error: "method-not-allowed" }); return; }

  try {
    const s = await db();
    const id = parseInt((req.body || {}).id, 10);
    if (!id) { res.status(400).json({ error: "invalid" }); return; }

    const [b] = await s`
      SELECT bk.*, c.name AS client_name, c.email AS client_email,
             c.extra_emails AS client_extra_emails, c.portal_token AS client_portal_token
      FROM bookings bk LEFT JOIN clients c ON c.id = bk.client_id
      WHERE bk.id = ${id}`;
    if (!b) { res.status(404).json({ error: "not-found" }); return; }
    const links = linksOf(b);
    if (!links.length) { res.status(400).json({ error: "no-links" }); return; }
    const clientTo = recipientsOf(b.client_email, b.client_extra_emails);
    if (!clientTo.length) { res.status(400).json({ error: "no-client-email" }); return; }

    // ensure the client has a portal token — the email button lands on
    // their portal with this delivery front and center
    let portalToken = b.client_portal_token;
    if (!portalToken) {
      portalToken = crypto.randomBytes(12).toString("base64url");
      await s`UPDATE clients SET portal_token = ${portalToken} WHERE id = ${b.client_id}`;
    }

    const token = b.delivery_token || crypto.randomBytes(12).toString("base64url");
    const pageUrl = `https://www.jacobcschrader.com/portal?c=${portalToken}&p=${b.id}`;
    const first = (b.client_name || "").split(" ")[0] || "there";
    const cc = String(b.delivery_cc || "").split(/[,;\s]+/).filter((e) => /.+@.+\..+/.test(e)).slice(0, 10);
    const note = String(b.delivery_message || "").trim();

    await sendEmail({
      to: clientTo,
      cc,
      replyTo: OWNER,
      subject: `Your delivery is ready — ${b.title}`,
      text: `Hi ${first},\n\n${note ? note + "\n\n" : ""}${b.title} is ready. View and download everything here:\n${pageUrl}\n\n` +
        `— Jacob Schrader · jacobcschrader.com`,
      html: brandedHtml({
        eyebrowText: "Your delivery",
        headline: `${escHtml(b.title)} is ready.`,
        bodyHtml:
          `<p style="margin:0 0 14px;">Hi ${escHtml(first)},</p>` +
          (note ? `<p style="margin:0 0 14px;">${escHtml(note)}</p>` : "") +
          `<p style="margin:0 0 14px;">Your full delivery for <b>${escHtml(b.title)}</b> is ready — ` +
          `everything included with your shoot.</p>` +
          (b.deliverables ? `<p style="margin:0;color:#5d6a7e;font-size:13px;">Included: ${escHtml(b.deliverables)}</p>` : ""),
        cta: { label: "View Your Delivery", url: pageUrl },
      }),
    });

    // advance stage if the project hasn't reached 'delivered' yet
    const preDelivered = ["upcoming", "editing", "revisions"].includes(b.status);
    const [updated] = await s`
      UPDATE bookings SET
        delivery_token = ${token},
        delivery_created_at = COALESCE(delivery_created_at, now()),
        delivery_sent_at = now(),
        delivery_sends = COALESCE(delivery_sends, 0) + 1,
        delivered_at = COALESCE(delivered_at, CURRENT_DATE),
        status = ${preDelivered ? "delivered" : b.status}
      WHERE id = ${id} RETURNING *`;

    res.status(200).json({ ok: true, booking: updated, pageUrl });
  } catch (e) {
    const msg = /DATABASE_URL/.test(String(e)) ? "db-not-configured"
      : /RESEND_API_KEY|Resend error/.test(String(e)) ? "send-failed" : "error";
    res.status(502).json({ error: msg });
  }
};
