// =====================================================================
//  POST /api/admin/confirm { id } — confirm a booking (auth required):
//    1. Emails a branded confirmation to the client (if they have an
//       email) and a copy to Jacob — both with a .ics calendar invite
//       containing the shoot slot and, if set, the twilight slot.
//    2. Stamps confirmed_at on the booking.
//  Safe to call again — resends the confirmation.
// =====================================================================
const { requireAuth } = require("../_lib/auth.js");
const { db } = require("../_lib/db.js");
const { sendEmail, brandedHtml, detailRow, OWNER } = require("../_lib/email.js");
const { buildIcs, fmtTime, gcalLink } = require("../_lib/ics.js");
const gcal = require("../_lib/gcal.js");
const { sigFor } = require("../calendar.js");

const escHtml = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") { res.status(405).json({ error: "method-not-allowed" }); return; }

  try {
    const s = await db();
    const id = parseInt((req.body || {}).id, 10);
    if (!id) { res.status(400).json({ error: "invalid" }); return; }

    const [b] = await s`
      SELECT bk.*, c.name AS client_name, c.email AS client_email, c.phone AS client_phone
      FROM bookings bk LEFT JOIN clients c ON c.id = bk.client_id
      WHERE bk.id = ${id}`;
    if (!b) { res.status(404).json({ error: "not-found" }); return; }
    if (!b.shoot_date) { res.status(400).json({ error: "no-date" }); return; }

    // ---- calendar events (main slot + optional twilight) -------------
    // Twilight is optional: with both twilight fields blank, only the
    // main slot exists anywhere (calendar, invites, emails).
    const fullAddress = [b.title, b.location].filter(Boolean).join(", ");
    const service = b.type || "Photography";
    const hasTwilight = !!(b.twilight_date || b.twilight_time);

    const slots = [{ key: "main", date: b.shoot_date, time: b.shoot_time || "", durationMin: 120 }];
    if (hasTwilight) slots.push({ key: "twilight", date: b.twilight_date || b.shoot_date, time: b.twilight_time || "", durationMin: 45 });

    // Jacob's calendar: "Client - Service", full address, Visaro-style body:
    //   Package / Property / Client (phone), then Deliverables, then Access notes.
    const ownerDesc = [
      `Package: ${service}`,
      `Property: ${fullAddress}`,
      b.client_name ? `Client: ${b.client_name}${b.client_phone ? " (" + b.client_phone.replace(/[^0-9+]/g, "") + ")" : ""}` : null,
      b.price ? `Price: $${Number(b.price).toLocaleString()}` : null,
      b.deliverables ? `\nDeliverables:\n• ${b.deliverables}` : null,
      b.notes ? `\nAccess notes:\n${b.notes}` : null,
      `\nhttps://www.jacobcschrader.com/admin#project/${b.id}`,
    ].filter(Boolean).join("\n");
    const ownerEvents = slots.map((sl) => ({
      uid: `jcs-${b.id}-${sl.key}@jacobcschrader.com`,
      title: `${b.client_name || b.title} - ${sl.key === "twilight" ? "Twilight" : service}`,
      date: sl.date, time: sl.time, durationMin: sl.durationMin,
      location: fullAddress,
      description: ownerDesc,
    }));

    // Client invite: property-first titles, no price/internal notes.
    const clientEvents = slots.map((sl) => ({
      uid: `jcs-${b.id}-${sl.key}@jacobcschrader.com`,
      title: `${sl.key === "twilight" ? "Twilight shoot" : "Shoot"} — ${b.title}`,
      date: sl.date, time: sl.time, durationMin: sl.durationMin,
      location: fullAddress,
      description: `${service} with Jacob Schrader${b.deliverables ? "\\nDeliverables: " + b.deliverables : ""} · jacobcschrader.com`,
    }));

    const mkIcs = (evts) => ({
      filename: "jcs-shoot.ics",
      content: Buffer.from(buildIcs(evts)).toString("base64"),
      content_type: "text/calendar",
    });
    const ownerIcs = mkIcs(ownerEvents);
    const events = clientEvents; // for the quick-add links below
    const addToCalUrl = `https://www.jacobcschrader.com/api/calendar?id=${b.id}&sig=${sigFor(b.id)}`;

    // ---- shared email fragments --------------------------------------
    const whenMain = `${new Date(String(b.shoot_date).slice(0, 10) + "T12:00:00")
      .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}` +
      (b.shoot_time ? ` · ${fmtTime(b.shoot_time)}` : "");
    const twiDate = b.twilight_date || b.shoot_date;
    const whenTwi = (b.twilight_date || b.twilight_time)
      ? `${new Date(String(twiDate).slice(0, 10) + "T12:00:00")
          .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}` +
        (b.twilight_time ? ` · ${fmtTime(b.twilight_time)}` : "")
      : null;

    const rows =
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:2px 0 20px;">` +
      detailRow("Property", escHtml(b.title)) +
      (b.location ? detailRow("Location", escHtml(b.location)) : "") +
      detailRow("Shoot", escHtml(whenMain)) +
      (whenTwi ? detailRow("Twilight", escHtml(whenTwi)) : "") +
      (b.type ? detailRow("Type", escHtml(b.type)) : "") +
      (b.deliverables ? detailRow("Deliverables", escHtml(b.deliverables)) : "") +
      `</table>`;
    const calLinks = `<p style="margin:16px 0 0;font-size:12.5px;">` +
      `<a href="${escHtml(gcalLink(events[0]))}" style="color:#0f2240;">Add shoot to Google Calendar</a>` +
      (events[1] ? ` &nbsp;·&nbsp; <a href="${escHtml(gcalLink(events[1]))}" style="color:#0f2240;">Add twilight</a>` : "") +
      `</p>`;

    // ---- 1) client confirmation (skipped gracefully if no email) -----
    let clientSent = false;
    if (b.client_email) {
      await sendEmail({
        to: b.client_email,
        replyTo: OWNER,
        subject: `Booking confirmed — ${b.title}`,
        text: `Your shoot is confirmed.\n\nProperty: ${b.title}\nShoot: ${whenMain}` +
          (whenTwi ? `\nTwilight: ${whenTwi}` : "") +
          `\n\nCalendar invite attached. — Jacob Schrader · jacobcschrader.com`,
        html: brandedHtml({
          eyebrowText: "Booking confirmed",
          headline: "You're on the calendar.",
          bodyHtml:
            `<p style="margin:0 0 16px;">Hi ${escHtml(b.client_name || "there")}, your shoot is confirmed — details below. ` +
            `A calendar invite is attached.</p>` + rows +
            `<p style="margin:0;">Questions before the shoot? Just reply to this email.</p>` + calLinks,
          cta: { label: "Add to Calendar", url: addToCalUrl },
        }),
      });
      clientSent = true;
    }

    // ---- 2) copy to Jacob --------------------------------------------
    await sendEmail({
      to: OWNER,
      subject: `Confirmed — ${b.title}${b.client_name ? " · " + b.client_name : ""}`,
      text: `Booking confirmed.\n\nProperty: ${b.title}\nClient: ${b.client_name || "—"}\nShoot: ${whenMain}` +
        (whenTwi ? `\nTwilight: ${whenTwi}` : "") + (b.price ? `\nPrice: $${Number(b.price).toLocaleString()}` : ""),
      html: brandedHtml({
        eyebrowText: "Booking confirmed",
        headline: escHtml(b.title),
        bodyHtml: rows.replace("</table>",
          (b.client_name ? detailRow("Client", escHtml(b.client_name)) : "") +
          (b.price ? detailRow("Price", "$" + Number(b.price).toLocaleString()) : "") + "</table>") +
          (clientSent
            ? `<p style="margin:0;">The client confirmation went to ${escHtml(b.client_email)}.</p>`
            : `<p style="margin:0;color:#8a4d2f;">No client email on file — only you received this.</p>`) + calLinks,
      }),
      attachments: [ownerIcs],
    });

    // ---- 3) write straight onto Jacob's Google Calendar (if set up) --
    let calendarWritten = false;
    if (gcal.isConfigured()) {
      try { await gcal.upsertEvents(ownerEvents); calendarWritten = true; }
      catch (e) { /* non-fatal: invite attachments still cover it */ }
    }

    const [updated] = await s`UPDATE bookings SET confirmed_at = now() WHERE id = ${id} RETURNING *`;
    res.status(200).json({ ok: true, clientSent, calendarWritten, booking: updated });
  } catch (e) {
    const msg = /DATABASE_URL/.test(String(e)) ? "db-not-configured"
      : /RESEND_API_KEY|Resend error/.test(String(e)) ? "send-failed" : "error";
    res.status(502).json({ error: msg });
  }
};
