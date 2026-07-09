// =====================================================================
//  /api/admin/discounts — discount codes CRUD (auth required)
//    GET              → list codes (newest first)
//    POST   {fields}  → create { code, kind: percent|amount, value, note }
//    PUT    {id, ...} → update (incl. active toggle)
//    DELETE {id}      → delete
// =====================================================================
const { requireAuth } = require("../auth.js");
const { db } = require("../db.js");

const field = (v, max = 300) => String(v == null ? "" : v).trim().slice(0, max);

function parse(b) {
  return {
    code: field(b.code, 40).toUpperCase().replace(/\s+/g, ""),
    kind: b.kind === "amount" ? "amount" : "percent",
    value: Number(b.value) || 0,
    note: field(b.note, 300),
    active: b.active !== false && b.active !== "false",
  };
}

module.exports = async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  try {
    const s = await db();
    const b = req.body || {};

    if (req.method === "GET") {
      const rows = await s`SELECT * FROM discounts ORDER BY created_at DESC`;
      res.status(200).json({ discounts: rows });

    } else if (req.method === "POST") {
      const f = parse(b);
      if (!f.code || f.value <= 0) { res.status(400).json({ error: "invalid" }); return; }
      if (f.kind === "percent" && f.value > 100) { res.status(400).json({ error: "invalid" }); return; }
      const [dupe] = await s`SELECT id FROM discounts WHERE upper(code) = ${f.code}`;
      if (dupe) { res.status(400).json({ error: "duplicate-code" }); return; }
      const [row] = await s`
        INSERT INTO discounts (code, kind, value, note, active)
        VALUES (${f.code}, ${f.kind}, ${f.value}, ${f.note}, ${f.active})
        RETURNING *`;
      res.status(200).json({ discount: row });

    } else if (req.method === "PUT") {
      const id = parseInt(b.id, 10);
      const f = parse(b);
      if (!id || !f.code || f.value <= 0) { res.status(400).json({ error: "invalid" }); return; }
      const [row] = await s`
        UPDATE discounts SET code = ${f.code}, kind = ${f.kind}, value = ${f.value},
          note = ${f.note}, active = ${f.active}
        WHERE id = ${id} RETURNING *`;
      if (!row) { res.status(404).json({ error: "not-found" }); return; }
      res.status(200).json({ discount: row });

    } else if (req.method === "DELETE") {
      const id = parseInt(b.id, 10);
      if (!id) { res.status(400).json({ error: "invalid" }); return; }
      await s`DELETE FROM discounts WHERE id = ${id}`;
      res.status(200).json({ ok: true });

    } else {
      res.status(405).json({ error: "method-not-allowed" });
    }
  } catch (e) {
    const msg = /DATABASE_URL/.test(String(e)) ? "db-not-configured" : "db-error";
    res.status(500).json({ error: msg });
  }
};
