// =====================================================================
//  ICS — calendar invite generator (attached to booking confirmations).
//
//  Builds a standards-compliant .ics file with one event per time slot
//  (main shoot + optional twilight), pinned to America/Los_Angeles so
//  times stay correct across DST. Events with no time become all-day.
// =====================================================================

const TZID = "America/Los_Angeles";

// Standard VTIMEZONE block for America/Los_Angeles.
const VTIMEZONE = `BEGIN:VTIMEZONE
TZID:${TZID}
BEGIN:DAYLIGHT
TZOFFSETFROM:-0800
TZOFFSETTO:-0700
TZNAME:PDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0700
TZOFFSETTO:-0800
TZNAME:PST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE`;

const escText = (s) =>
  String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const pad = (n) => String(n).padStart(2, "0");

function dtLocal(dateStr, timeStr) {
  // dateStr YYYY-MM-DD (may arrive as full ISO), timeStr HH:MM
  const d = String(dateStr).slice(0, 10).replace(/-/g, "");
  const t = /^\d{2}:\d{2}/.test(String(timeStr || "")) ? timeStr.slice(0, 5).replace(":", "") + "00" : null;
  return { d, t };
}

function addMinutes(dateStr, timeStr, mins) {
  const dt = new Date(`${String(dateStr).slice(0, 10)}T${timeStr.slice(0, 5)}:00`);
  dt.setMinutes(dt.getMinutes() + mins);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

// events: [{ uid, title, date, time (HH:MM or ""), durationMin, location, description }]
function buildIcs(events) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const blocks = events.map((e) => {
    const { d, t } = dtLocal(e.date, e.time);
    const when = t
      ? `DTSTART;TZID=${TZID}:${d}T${t}\nDTEND;TZID=${TZID}:${addMinutes(e.date, e.time, e.durationMin || 120)}`
      : `DTSTART;VALUE=DATE:${d}`;
    return `BEGIN:VEVENT
UID:${e.uid}
DTSTAMP:${stamp}
${when}
SUMMARY:${escText(e.title)}
${e.location ? `LOCATION:${escText(e.location)}\n` : ""}${e.description ? `DESCRIPTION:${escText(e.description)}\n` : ""}STATUS:CONFIRMED
END:VEVENT`;
  }).join("\n");

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//JCS//Studio Admin//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${VTIMEZONE}
${blocks}
END:VCALENDAR`.replace(/\n/g, "\r\n");
}

// "17:30" → "5:30 PM" (for email copy)
function fmtTime(t) {
  if (!/^\d{2}:\d{2}/.test(String(t || ""))) return t || "";
  let [h, m] = t.slice(0, 5).split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${ap}`;
}

// Google Calendar quick-add URL for one event
function gcalLink(e) {
  const { d, t } = dtLocal(e.date, e.time);
  const dates = t ? `${d}T${t}/${addMinutes(e.date, e.time, e.durationMin || 120)}` : `${d}/${d}`;
  const q = new URLSearchParams({
    action: "TEMPLATE", text: e.title, dates,
    ctz: TZID, location: e.location || "", details: e.description || "",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

module.exports = { buildIcs, fmtTime, gcalLink, TZID };
