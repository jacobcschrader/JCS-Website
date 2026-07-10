// =====================================================================
//  GET /api/cron — daily, called by Vercel Cron (vercel.json → crons;
//  runs 14:00 UTC = 6/7am Pacific).
//
//  One job: projects whose shoot date has arrived (LA time) move
//  upcoming → editing. Nothing else — no Pixieset drafts, no emails.
//
//  Optionally protect it: set a CRON_SECRET env var in Vercel — their
//  cron invocations send "Authorization: Bearer <CRON_SECRET>"
//  automatically, and anyone else gets a 401. Without the env var the
//  endpoint stays open but is idempotent and exposes nothing.
// =====================================================================
const { db } = require("./_lib/db.js");

module.exports = async function handler(req, res) {
  try {
    if (process.env.CRON_SECRET &&
        req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const s = await db();
    const todayLA = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
    const moved = await s`
      UPDATE bookings SET status = 'editing'
      WHERE status = 'upcoming' AND shoot_date IS NOT NULL AND shoot_date <= ${todayLA}
      RETURNING id`;

    res.status(200).json({ ok: true, moved: moved.length });
  } catch (e) {
    const msg = /DATABASE_URL/.test(String(e)) ? "db-not-configured" : "error";
    res.status(500).json({ error: msg });
  }
};
