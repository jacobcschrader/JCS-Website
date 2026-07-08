// =====================================================================
//  /api/admin/bookings — booking CRUD (auth required)
//    GET              → list bookings (with client name)
//    POST   {fields}  → create
//    PUT    {id, ...} → update
//    DELETE {id}      → delete
//  Pipeline stages: upcoming | editing | revisions | delivered | completed | paid
//  (+ canceled). Delivery fields: delivery_url, delivered_at.
// =====================================================================
const { requireAuth } = require("../_lib/auth.js");
const { db } = require("../_lib/db.js");

const field = (v, max = 300) => String(v == null ? "" : v).trim().slice(0, max);
const STATUSES = ["upcoming", "editing", "revisions", "delivered", "completed", "paid", "canceled"];

function parse(b) {
  return {
    title: field(b.title, 200),
    location: field(b.location, 200),
    shoot_date: field(b.shoot_date, 10) || null,   // YYYY-MM-DD
    shoot_time: field(b.shoot_time, 40),
    type: field(b.type, 100),
    price: b.price === "" || b.price == null ? null : Number(b.price) || null,
    status: STATUSES.includes(b.status) ? b.status : "upcoming",
    notes: field(b.notes, 5000),
    client_id: b.client_id ? parseInt(b.client_id, 10) || null : null,
    delivery_url: field(b.delivery_url, 600),
    delivered_at: field(b.delivered_at, 10) || null,
    twilight_date: field(b.twilight_date, 10) || null,
    twilight_time: field(b.twilight_time, 40),
    deliverables: field(b.deliverables, 2000),
    city: field(b.city, 120),
    state: field(b.state, 10),
    zip: field(b.zip, 12),
    sqft: b.sqft === "" || b.sqft == null ? null : parseInt(b.sqft, 10) || null,
    addons: field(b.addons, 2000),
    travel_fee: b.travel_fee === "" || b.travel_fee == null ? null : Number(b.travel_fee) || null,
    travel_note: field(b.travel_note, 300),
    show_price: b.show_price !== false && b.show_price !== "false",
  };
}

// location is derived: "City, ST 96145" (falls back to a raw location string)
function makeLocation(f, raw) {
  const cityBit = [f.city, [f.state, f.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return cityBit || field(raw, 200);
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
      f.location = makeLocation(f, b.location);
      if (!f.title) { res.status(400).json({ error: "title-required" }); return; }
      const [row] = await s`
        INSERT INTO bookings (client_id, title, location, shoot_date, shoot_time, type, price, status, notes, delivery_url, delivered_at, twilight_date, twilight_time, deliverables, city, state, zip, sqft, addons, travel_fee, travel_note, show_price)
        VALUES (${f.client_id}, ${f.title}, ${f.location}, ${f.shoot_date}, ${f.shoot_time}, ${f.type}, ${f.price}, ${f.status}, ${f.notes}, ${f.delivery_url}, ${f.delivered_at}, ${f.twilight_date}, ${f.twilight_time}, ${f.deliverables}, ${f.city}, ${f.state}, ${f.zip}, ${f.sqft}, ${f.addons}, ${f.travel_fee}, ${f.travel_note}, ${f.show_price})
        RETURNING *`;
      res.status(200).json({ booking: row });

    } else if (req.method === "PUT") {
      const id = parseInt(b.id, 10);
      const f = parse(b);
      f.location = makeLocation(f, b.location);
      if (!id || !f.title) { res.status(400).json({ error: "invalid" }); return; }
      const [row] = await s`
        UPDATE bookings SET
          client_id = ${f.client_id}, title = ${f.title}, location = ${f.location},
          shoot_date = ${f.shoot_date}, shoot_time = ${f.shoot_time}, type = ${f.type},
          price = ${f.price}, status = ${f.status}, notes = ${f.notes},
          delivery_url = ${f.delivery_url}, delivered_at = ${f.delivered_at},
          twilight_date = ${f.twilight_date}, twilight_time = ${f.twilight_time},
          deliverables = ${f.deliverables}, city = ${f.city}, state = ${f.state}, zip = ${f.zip},
          sqft = ${f.sqft}, addons = ${f.addons}, travel_fee = ${f.travel_fee},
          travel_note = ${f.travel_note}, show_price = ${f.show_price}
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
