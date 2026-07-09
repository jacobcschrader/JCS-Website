// =====================================================================
//  /api/admin/clients — client CRUD (auth required)
//    GET              → list clients (with booking counts)
//    POST   {fields}  → create
//    PUT    {id, ...} → update
//    DELETE {id}      → delete
// =====================================================================
const { requireAuth } = require("../auth.js");
const { db } = require("../db.js");

const field = (v, max = 300) => String(v == null ? "" : v).trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Co-recipient emails: JSON array in, validated + deduped JSON out ('').
function parseEmails(raw, primary) {
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw || "[]") : raw || [];
    const seen = new Set([String(primary || "").toLowerCase()]);
    const clean = (Array.isArray(arr) ? arr : [])
      .map((e) => field(e, 200).toLowerCase())
      .filter((e) => EMAIL_RE.test(e) && !seen.has(e) && seen.add(e))
      .slice(0, 10);
    return clean.length ? JSON.stringify(clean) : "";
  } catch (e) { return ""; }
}

module.exports = async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  try {
    const s = await db();
    const b = req.body || {};

    if (req.method === "GET") {
      const rows = await s`
        SELECT c.*, count(bk.id)::int AS booking_count
        FROM clients c LEFT JOIN bookings bk ON bk.client_id = c.id
        GROUP BY c.id ORDER BY c.name ASC`;
      res.status(200).json({ clients: rows });

    } else if (req.method === "POST") {
      const name = field(b.name, 200);
      if (!name) { res.status(400).json({ error: "name-required" }); return; }
      const [row] = await s`
        INSERT INTO clients (name, email, phone, brokerage, notes, extra_emails)
        VALUES (${name}, ${field(b.email)}, ${field(b.phone, 60)}, ${field(b.brokerage)}, ${field(b.notes, 5000)}, ${parseEmails(b.extra_emails, b.email)})
        RETURNING *`;
      res.status(200).json({ client: row });

    } else if (req.method === "PUT") {
      const id = parseInt(b.id, 10);
      const name = field(b.name, 200);
      if (!id || !name) { res.status(400).json({ error: "invalid" }); return; }
      const [row] = await s`
        UPDATE clients SET
          name = ${name}, email = ${field(b.email)}, phone = ${field(b.phone, 60)},
          brokerage = ${field(b.brokerage)}, notes = ${field(b.notes, 5000)},
          extra_emails = ${parseEmails(b.extra_emails, b.email)}
        WHERE id = ${id} RETURNING *`;
      if (!row) { res.status(404).json({ error: "not-found" }); return; }
      res.status(200).json({ client: row });

    } else if (req.method === "DELETE") {
      const id = parseInt(b.id, 10);
      if (!id) { res.status(400).json({ error: "invalid" }); return; }
      await s`DELETE FROM clients WHERE id = ${id}`;
      res.status(200).json({ ok: true });

    } else {
      res.status(405).json({ error: "method-not-allowed" });
    }
  } catch (e) {
    const msg = /DATABASE_URL/.test(String(e)) ? "db-not-configured" : "db-error";
    res.status(500).json({ error: msg });
  }
};
