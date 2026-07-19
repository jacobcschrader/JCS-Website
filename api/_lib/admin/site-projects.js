// =====================================================================
//  /api/admin/siteprojects — portfolio CMS CRUD (auth required)
//    GET              → all projects, drafts included (admin list)
//    POST   {fields}  → create (starts as draft unless told otherwise)
//    PUT    {id, ...} → update; media removed from the project is also
//                       deleted from Vercel Blob (best-effort)
//    DELETE {id}      → delete row + all its Blob media (best-effort)
//  Media itself is uploaded straight from the browser to Vercel Blob
//  (see upload.js); this handler only stores the resulting URLs.
// =====================================================================
const { requireAuth } = require("../auth.js");
const { db } = require("../db.js");

const field = (v, max = 300) => String(v == null ? "" : v).trim().slice(0, max);

function slugify(s) {
  return field(s, 120).toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 80);
}

// gallery: JSON array of Blob URLs — validated + re-stringified
function parseGallery(raw) {
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw || "[]") : raw || [];
    return JSON.stringify(
      (Array.isArray(arr) ? arr : [])
        .map((u) => field(u, 800))
        .filter((u) => /^https:\/\//.test(u))
        .slice(0, 150)
    );
  } catch (e) { return "[]"; }
}

function parse(b) {
  return {
    slug: slugify(b.slug || b.title),
    title: field(b.title, 200),
    location: field(b.location, 200),
    year: field(b.year, 10),
    headline: field(b.headline, 200),
    summary: field(b.summary, 3000),
    shot_for: field(b.shot_for, 200),
    brokerage: field(b.brokerage, 200),
    price: field(b.price, 60),
    cover_url: field(b.cover_url, 800),
    gallery: parseGallery(b.gallery),
    horizontal_url: field(b.horizontal_url, 800),
    vertical_url: field(b.vertical_url, 800),
    draft: b.draft !== false && b.draft !== "false",
    sort_order: parseInt(b.sort_order, 10) || 0,
  };
}

// Every Blob URL a project row references.
function urlsOf(row) {
  const urls = [];
  if (row.cover_url) urls.push(row.cover_url);
  if (row.horizontal_url) urls.push(row.horizontal_url);
  if (row.vertical_url) urls.push(row.vertical_url);
  try { JSON.parse(row.gallery || "[]").forEach((u) => urls.push(u)); } catch (e) {}
  return urls.filter((u) => /\.blob\.vercel-storage\.com\//.test(u));
}

// Best-effort Blob cleanup — never blocks the save.
async function delBlobs(urls) {
  if (!urls.length || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    const { del } = require("@vercel/blob");
    await del(urls);
  } catch (e) { /* orphaned blobs are harmless */ }
}

module.exports = async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  try {
    const s = await db();
    const b = req.body || {};

    if (req.method === "GET") {
      const rows = await s`SELECT * FROM site_projects ORDER BY sort_order ASC, id DESC`;
      res.status(200).json({ projects: rows });

    } else if (req.method === "POST") {
      const f = parse(b);
      if (!f.title || !f.slug) { res.status(400).json({ error: "title-required" }); return; }
      const [dup] = await s`SELECT id FROM site_projects WHERE slug = ${f.slug}`;
      if (dup) { res.status(400).json({ error: "slug-taken" }); return; }
      const [row] = await s`
        INSERT INTO site_projects (slug, title, location, year, headline, summary, shot_for, brokerage, price, cover_url, gallery, horizontal_url, vertical_url, draft, sort_order)
        VALUES (${f.slug}, ${f.title}, ${f.location}, ${f.year}, ${f.headline}, ${f.summary}, ${f.shot_for}, ${f.brokerage}, ${f.price}, ${f.cover_url}, ${f.gallery}, ${f.horizontal_url}, ${f.vertical_url}, ${f.draft}, ${f.sort_order})
        RETURNING *`;
      res.status(200).json({ project: row });

    } else if (req.method === "PUT") {
      const id = parseInt(b.id, 10);
      const f = parse(b);
      if (!id || !f.title || !f.slug) { res.status(400).json({ error: "invalid" }); return; }
      const [old] = await s`SELECT * FROM site_projects WHERE id = ${id}`;
      if (!old) { res.status(404).json({ error: "not-found" }); return; }
      const [dup] = await s`SELECT id FROM site_projects WHERE slug = ${f.slug} AND id != ${id}`;
      if (dup) { res.status(400).json({ error: "slug-taken" }); return; }
      const [row] = await s`
        UPDATE site_projects SET
          slug = ${f.slug}, title = ${f.title}, location = ${f.location}, year = ${f.year},
          headline = ${f.headline}, summary = ${f.summary}, shot_for = ${f.shot_for},
          brokerage = ${f.brokerage}, price = ${f.price}, cover_url = ${f.cover_url},
          gallery = ${f.gallery}, horizontal_url = ${f.horizontal_url},
          vertical_url = ${f.vertical_url}, draft = ${f.draft}, sort_order = ${f.sort_order},
          updated_at = now()
        WHERE id = ${id} RETURNING *`;
      // free any media that was removed in this edit
      const keep = new Set(urlsOf(row));
      await delBlobs(urlsOf(old).filter((u) => !keep.has(u)));
      res.status(200).json({ project: row });

    } else if (req.method === "DELETE") {
      const id = parseInt(b.id, 10);
      if (!id) { res.status(400).json({ error: "invalid" }); return; }
      const [old] = await s`SELECT * FROM site_projects WHERE id = ${id}`;
      await s`DELETE FROM site_projects WHERE id = ${id}`;
      if (old) await delBlobs(urlsOf(old));
      res.status(200).json({ ok: true });

    } else {
      res.status(405).json({ error: "method-not-allowed" });
    }
  } catch (e) {
    const msg = /DATABASE_URL/.test(String(e)) ? "db-not-configured" : "db-error";
    res.status(500).json({ error: msg });
  }
};
