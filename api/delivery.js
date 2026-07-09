// =====================================================================
//  GET /api/delivery?t=<token> — public, powers the branded delivery
//  page at /delivery?t=… . Returns only client-safe fields (no price,
//  no access notes). Tokens are random, issued when the delivery is
//  created in the admin.
// =====================================================================
const { db } = require("./_lib/db.js");
const { linksOf } = require("./_lib/links.js");

module.exports = async function handler(req, res) {
  try {
    const t = String((req.query || {}).t || "");
    if (!t || t.length < 10) { res.status(404).json({ error: "not-found" }); return; }

    const s = await db();
    const [b] = await s`
      SELECT bk.title, bk.location, bk.deliverables, bk.delivery_url, bk.download_url,
             bk.delivery_links, bk.delivered_at, bk.delivery_sent_at, c.name AS client_name
      FROM bookings bk LEFT JOIN clients c ON c.id = bk.client_id
      WHERE bk.delivery_token = ${t} LIMIT 1`;
    if (!b) { res.status(404).json({ error: "not-found" }); return; }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      title: b.title,
      location: b.location || "",
      deliverables: b.deliverables || "",
      links: linksOf(b),
      delivered_at: b.delivered_at || b.delivery_sent_at || null,
      client_first: (b.client_name || "").split(" ")[0] || "",
    });
  } catch (e) {
    res.status(500).json({ error: "error" });
  }
};
