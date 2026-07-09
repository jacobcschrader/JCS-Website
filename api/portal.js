// =====================================================================
//  /api/portal — the client portal, public:
//    GET  ?c=<client_token>  → portal data (client-safe fields only:
//         no access notes, no pricing until an invoice was sent).
//    POST { email }          → magic-link login: if the email is on a
//         client profile (primary or co-recipient), their portal link
//         is emailed to it. Always responds ok — never reveals whether
//         an email exists.
//  One private token per client, issued on first delivery or first
//  login request.
// =====================================================================
const crypto = require("node:crypto");
const { db } = require("./_lib/db.js");
const { linksOf } = require("./_lib/links.js");
const { sendEmail, brandedHtml } = require("./_lib/email.js");

const STAGE = {
  upcoming: "Booked",
  editing: "In production",
  revisions: "In production",
  delivered: "Delivered",
  completed: "Delivered",
  paid: "Delivered",
};

async function magicLink(req, res) {
  const body = req.body || {};
  // honeypot — bots fill every field
  if (body.company) { res.status(200).json({ ok: true }); return; }
  const email = String(body.email || "").trim().toLowerCase();
  const done = () => res.status(200).json({ ok: true });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { done(); return; }

  const s = await db();
  // match primary email or any co-recipient email on the profile
  const rows = await s`
    SELECT * FROM clients
    WHERE lower(email) = ${email} OR extra_emails ILIKE ${"%" + email + "%"}
    LIMIT 5`;
  const c = rows.find((r) => {
    if (String(r.email || "").toLowerCase() === email) return true;
    try { return JSON.parse(r.extra_emails || "[]").some((e) => String(e).toLowerCase() === email); }
    catch (e) { return false; }
  });
  if (!c) { done(); return; }

  let token = c.portal_token;
  if (!token) {
    token = crypto.randomBytes(12).toString("base64url");
    await s`UPDATE clients SET portal_token = ${token} WHERE id = ${c.id}`;
  }
  const url = `https://www.jacobcschrader.com/portal?c=${token}`;
  const first = (c.name || "").split(" ")[0] || "there";

  await sendEmail({
    to: email,
    subject: "Your client portal — Jacob Schrader",
    text: `Hi ${first},\n\nHere is your private portal link — projects, deliveries, and invoices:\n${url}\n\n` +
      `Keep this link handy; it always works.\n\n— Jacob Schrader · jacobcschrader.com`,
    html: brandedHtml({
      eyebrowText: "Client portal",
      headline: "Your projects, one place.",
      bodyHtml:
        `<p style="margin:0 0 14px;">Hi ${first.replace(/[<>&]/g, "")},</p>` +
        `<p style="margin:0 0 14px;">Here is your private portal — every project, delivery, and invoice, always current.</p>` +
        `<p style="margin:0;color:#5d6a7e;font-size:13px;">This link is yours alone and always works — no password needed.</p>`,
      cta: { label: "Open Your Portal", url },
    }),
  });
  done();
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "POST") { await magicLink(req, res); return; }

    const t = String((req.query || {}).c || "");
    if (!t || t.length < 10) { res.status(404).json({ error: "not-found" }); return; }

    const s = await db();
    const [c] = await s`SELECT id, name FROM clients WHERE portal_token = ${t} LIMIT 1`;
    if (!c) { res.status(404).json({ error: "not-found" }); return; }

    const rows = await s`
      SELECT * FROM bookings
      WHERE client_id = ${c.id} AND status != 'canceled'
      ORDER BY shoot_date DESC NULLS LAST, id DESC`;

    let outstanding = 0;
    const projects = rows.map((b) => {
      const total = (Number(b.price) || 0) + (Number(b.travel_fee) || 0) - (Number(b.discount_value) || 0);
      const invoiced = !!(b.invoice_token && b.invoice_sent_at);
      const paid = b.status === "paid";
      if (invoiced && !paid) outstanding += total;
      return {
        id: b.id,
        title: b.title,
        location: b.location || "",
        shoot_date: b.shoot_date || null,
        service: b.type || "",
        stage: STAGE[b.status] || "Booked",
        delivery: b.delivery_sent_at
          ? { token: b.delivery_token, links: linksOf(b), delivered_at: b.delivered_at || null }
          : null,
        invoice: invoiced
          ? { token: b.invoice_token, number: "JCS-" + String(b.id).padStart(4, "0"), total, paid }
          : null,
      };
    });

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      client_first: (c.name || "").split(" ")[0] || "",
      client_name: c.name || "",
      stats: {
        production: projects.filter((p) => p.stage === "In production").length,
        delivered: projects.filter((p) => p.stage === "Delivered").length,
        outstanding,
      },
      projects,
    });
  } catch (e) {
    res.status(500).json({ error: "error" });
  }
};
