// =====================================================================
//  /api/admin/bookings — booking CRUD (auth required)
//    GET              → list bookings (with client name)
//    POST   {fields}  → create
//    PUT    {id, ...} → update
//    DELETE {id}      → delete
//  status: scheduled | completed | delivered | canceled
// =====================================================================
const { requireAuth } = require("../_lib/auth.js");
const { db } = require("../_lib/db.js");

const field = (v, max = 300) => String(v == null ? "" : v).trim().slice(0, max);
const STATUSES = ["scheduled", "completed", "delivered", "canceled"];

function parse(b) {
  return {
    title: field(b.title, 200),
    location: field(b.location, 200),
    shoot_date: field(b.shoot_date, 10) || null,   // YYYY-MM-DD
    shoot_time: field(b.shoot_time, 40),
    type: field(b.type, 100),
    price: b.price === "" || b.price == null ? null : Number(b.price) || null,
    status: STATUSES.includes(b.status) ? b.status : "scheduled",
    notes: field(b.notes, 5000),
    client_id: b.client_id ? parseInt(b.client_id, 10) || null : null,
  };
}

module.exports = async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  try {
    const s = await db();
    const b = req.body || {};

    if (req.method === "GET") {
      const rows = await s`
        SELECT bk.*, c.name AS client_name
        FROM bookings bk LEFT JOIN clients c ON c.id = bk.client_id
        ORDER BY bk.shoot_date DESC NULLS LAST, bk.id DESC`;
      res.status(200).json({ bookings: rows });

    } else if (req.method === "POST") {
      const f = parse(b);
      if (!f.title) { res.status(400).json({ error: "title-required" }); return; }
      const [row] = await s`
        INSERT INTO bookings (client_id, title, location, shoot_date, shoot_time, type, price, status, notes)
        VALUES (${f.client_id}, ${f.title}, ${f.location}, ${f.shoot_date}, ${f.shoot_time}, ${f.type}, ${f.price}, ${f.status}, ${f.notes})
        RETURNING *`;
      res.status(200).json({ booking: row });

    } else if (req.method === "PUT") {
      const id = parseInt(b.id, 10);
      const f = parse(b);
      if (!id || !f.title) { res.status(400).json({ error: "invalid" }); return; }
      const [row] = await s`
        UPDATE bookings SET
          client_id = ${f.client_id}, title = ${f.title}, location = ${f.location},
          shoot_date = ${f.shoot_date}, shoot_time = ${f.shoot_time}, type = ${f.type},
          price = ${f.price}, status = ${f.status}, notes = ${f.notes}
        WHERE id = ${id} RETURNING *`;
      if (!row) { res.status(404).json({ error: "not-found" }); return; }
      res.status(200).json({ booking: row });

    } else if (req.method === "DELETE") {
      const id = parseInt(b.id, 10);
      if (!id) { res.status(400).json({ error: "invalid" }); return; }
      await s`DELETE FROM bookings WHERE id = ${id}`;
      res.status(200).json({ ok: true });

    } else {
      res.status(405).json({ error: "method-not-allowed" });
    }
  } catch (e) {
    const msg = /DATABASE_URL/.test(String(e)) ? "db-not-configured" : "db-error";
    res.status(500).json({ error: msg });
  }
};
