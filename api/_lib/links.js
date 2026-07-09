// =====================================================================
//  Named delivery links for a booking. delivery_links is a JSON array
//  of { label, url }; legacy bookings that only have delivery_url /
//  download_url fall back to Gallery / Download entries.
// =====================================================================
function linksOf(b) {
  try {
    const arr = JSON.parse(b.delivery_links || "[]");
    if (Array.isArray(arr) && arr.length) {
      return arr.filter((l) => l && l.url).map((l) => ({
        label: String(l.label || "View").slice(0, 80),
        url: String(l.url).slice(0, 600),
      }));
    }
  } catch (e) { /* fall through */ }
  const legacy = [];
  if (b.delivery_url) legacy.push({ label: "View Gallery", url: b.delivery_url });
  if (b.download_url) legacy.push({ label: "Download Films & Files", url: b.download_url });
  return legacy;
}

// All addresses on a client profile: primary + extra_emails (JSON).
// Every client-facing notification goes to the full list.
function recipientsOf(primary, extraJson) {
  const out = [];
  const seen = new Set();
  [primary].concat(safeArr(extraJson)).forEach((e) => {
    const v = String(e || "").trim().toLowerCase();
    if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && !seen.has(v)) { seen.add(v); out.push(v); }
  });
  return out;
}
function safeArr(raw) {
  try { const a = JSON.parse(raw || "[]"); return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}

module.exports = { linksOf, recipientsOf };
