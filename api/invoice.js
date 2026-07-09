// =====================================================================
//  GET /api/invoice?t=<token> — public, powers the branded invoice
//  page at /invoice?t=… . Returns only what belongs on an invoice —
//  no access notes, no internal fields.
// =====================================================================
const { db } = require("./_lib/db.js");

module.exports = async function handler(req, res) {
  try {
    const t = String((req.query || {}).t || "");
    if (!t || t.length < 10) { res.status(404).json({ error: "not-found" }); return; }

    const s = await db();
    const [b] = await s`
      SELECT bk.id, bk.title, bk.location, bk.type, bk.shoot_date, bk.price,
             bk.travel_fee, bk.travel_note, bk.discount_code, bk.discount_value,
             bk.status, bk.deliverables, bk.invoice_sent_at, bk.created_at,
             c.name AS client_name, c.brokerage AS client_brokerage
      FROM bookings bk LEFT JOIN clients c ON c.id = bk.client_id
      WHERE bk.invoice_token = ${t} LIMIT 1`;
    if (!b) { res.status(404).json({ error: "not-found" }); return; }

    const items = [{ label: b.type || "Photography", detail: b.deliverables || "", amount: Number(b.price) || 0 }];
    if (Number(b.travel_fee)) items.push({ label: "Travel", detail: b.travel_note || "", amount: Number(b.travel_fee) });
    if (Number(b.discount_value)) items.push({ label: "Discount", detail: b.discount_code || "", amount: -Number(b.discount_value) });

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      number: "JCS-" + String(b.id).padStart(4, "0"),
      title: b.title,
      location: b.location || "",
      shoot_date: b.shoot_date || null,
      issued: b.invoice_sent_at || b.created_at || null,
      client: { name: b.client_name || "", brokerage: b.client_brokerage || "" },
      items,
      total: items.reduce((s2, i) => s2 + i.amount, 0),
      paid: b.status === "paid",
    });
  } catch (e) {
    res.status(500).json({ error: "error" });
  }
};
