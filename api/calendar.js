// =====================================================================
//  GET /api/calendar?id=<booking>&sig=<hmac> — public, signed .ics
//  download used by the "Add to Calendar" button in client booking
//  confirmations. The signature (HMAC of the booking id) makes links
//  unguessable; only someone with the email can fetch the file.
//  Serves the CLIENT version of the events (no price, no access notes).
// =====================================================================
const crypto = require("node:crypto");
const { db } = require("./_lib/db.js");
const { buildIcs } = require("./_lib/ics.js");

function sigFor(id) {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET || "")
    .update(`cal-${id}`).digest("base64url").slice(0, 24);
}

module.exports = async function handler(req, res) {
  try {
    const { id, sig } = req.query || {};
    const bid = parseInt(id, 10);
    if (!bid || !sig || !process.env.SESSION_SECRET) { res.status(404).send("Not found"); return; }
    const expected = sigFor(bid);
    const a = Buffer.from(String(sig)), e = Buffer.from(expected);
    if (a.length !== e.length || !crypto.timingSafeEqual(a, e)) { res.status(404).send("Not found"); return; }

    const s = await db();
    const [b] = await s`SELECT bk.*, c.name AS client_name FROM bookings bk
      LEFT JOIN clients c ON c.id = bk.client_id WHERE bk.id = ${bid}`;
    if (!b || !b.shoot_date) { res.status(404).send("Not found"); return; }

    const fullAddress = [b.title, b.location].filter(Boolean).join(", ");
    const service = b.type || "Photography";
    const events = [{
      uid: `jcs-${b.id}-main@jacobcschrader.com`,
      title: `Shoot — ${b.title}`,
      date: b.shoot_date, time: b.shoot_time || "", durationMin: 120,
      location: fullAddress,
      description: `${service} with Jacob Schrader${b.deliverables ? "\nDeliverables: " + b.deliverables : ""} · jacobcschrader.com`,
    }];
    if (b.twilight_date || b.twilight_time) {
      events.push({
        uid: `jcs-${b.id}-twilight@jacobcschrader.com`,
        title: `Twilight shoot — ${b.title}`,
        date: b.twilight_date || b.shoot_date, time: b.twilight_time || "", durationMin: 45,
        location: fullAddress,
        description: `Twilight session with Jacob Schrader · jacobcschrader.com`,
      });
    }

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="jcs-shoot.ics"');
    res.status(200).send(buildIcs(events));
  } catch (e) {
    res.status(500).send("Error");
  }
};

module.exports.sigFor = sigFor;
