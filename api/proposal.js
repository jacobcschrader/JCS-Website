// =====================================================================
//  /api/proposal — public, slug-gated, powers /proposals/<slug> and
//  proposal.jacobcschrader.com/<slug>.
//    GET  ?slug=<slug>[&preview=1]   → client-safe proposal data
//         (drafts are hidden unless the caller has a valid admin
//          session and passes preview=1)
//    POST { slug, action:"accept", name } → stamps accepted_at/by,
//         emails Jacob. Accepting twice is a no-op.
//  Slugs are unguessable enough for share links (like delivery tokens,
//  possession of the URL is the credential) and carry no payment data.
// =====================================================================
const { db } = require("./_lib/db.js");
const { verifySessionToken, readCookie } = require("./_lib/auth.js");
const { sendEmail, jcsEmail, SENDERS, OWNER } = require("./_lib/email.js");

const escHtml = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const cleanSlug = (v) =>
  String(v || "").toLowerCase().trim().replace(/[^a-z0-9-]/g, "").slice(0, 120);

function publicShape(p) {
  let items = [];
  try { items = JSON.parse(p.items || "[]"); } catch (e) {}
  return {
    title: p.title,
    location: p.location || "",
    client_name: p.client_name || "",
    intro: p.intro || "",
    items,
    note: p.note || "",
    status: p.status,
    sent_at: p.sent_at || null,
    accepted_at: p.accepted_at || null,
    created_at: p.created_at,
  };
}

module.exports = async function handler(req, res) {
  try {
    const s = await db();

    if (req.method === "POST") {
      const b = req.body || {};
      const slug = cleanSlug(b.slug);
      const name = String(b.name || "").trim().slice(0, 200);
      if (!slug || b.action !== "accept" || name.length < 3) {
        res.status(400).json({ error: "invalid" }); return;
      }
      const [p] = await s`SELECT * FROM proposals WHERE slug = ${slug} AND status <> 'draft' LIMIT 1`;
      if (!p) { res.status(404).json({ error: "not-found" }); return; }
      if (p.accepted_at) { res.status(200).json({ ok: true, accepted_at: p.accepted_at }); return; }

      const [row] = await s`
        UPDATE proposals SET accepted_at = now(), accepted_by = ${name}, status = 'accepted', updated_at = now()
        WHERE id = ${p.id} RETURNING accepted_at`;

      let total = 0;
      try { JSON.parse(p.items || "[]").forEach((it) => { if (typeof it.price === "number") total += it.price; }); } catch (e) {}
      const adminUrl = `https://www.jacobcschrader.com/admin#proposal/${p.id}`;
      await sendEmail({
        from: SENDERS.admin,
        to: OWNER,
        subject: `${p.title} | Proposal Accepted`,
        text: `${name} accepted the proposal for ${p.title} (${total ? "$" + total.toLocaleString() : "custom"}).\n${adminUrl}`,
        html: jcsEmail({
          eyebrow: "Proposal Accepted",
          headline: `${escHtml(p.client_name || name)} · ${escHtml(p.title)}`,
          note: `${escHtml(name)} reserved the dates — follow up within 24 hours to lock in the schedule.`,
          rows: [
            ["Property", escHtml(p.title)],
            ["Signed by", escHtml(name)],
            ["Campaign", total ? "$" + total.toLocaleString() : ""],
          ],
          cta: { label: "Open in Admin", url: adminUrl },
          audience: "admin",
        }),
      }).catch(() => {});
      res.status(200).json({ ok: true, accepted_at: row.accepted_at });
      return;
    }

    // ---- GET ----------------------------------------------------------
    const q = req.query || {};
    const slug = cleanSlug(q.slug);
    if (!slug) { res.status(404).json({ error: "not-found" }); return; }
    const [p] = await s`SELECT * FROM proposals WHERE slug = ${slug} LIMIT 1`;
    const isAdmin = q.preview && verifySessionToken(readCookie(req));
    if (!p || (p.status === "draft" && !isAdmin)) {
      res.status(404).json({ error: "not-found" }); return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(publicShape(p));
  } catch (e) {
    res.status(500).json({ error: "error" });
  }
};
