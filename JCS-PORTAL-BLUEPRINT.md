# JCS Studio Portal — Duplication Blueprint (from The Visaro)

Source: hands-on walkthrough of app.thevisaro.com (Jul 2026), including
creating a live test project ("123 Test Street" · Demo Agent (Test) —
left in place, safe to delete). Goal: replicate the portal at
jacobcschrader.com/admin, branded JCS (navy/paper, Cormorant + Inter).

---

## 1. What Visaro has (complete catalog)

**Dashboard** — date header; global search (projects + clients); stat
cards: Pending requests, Active projects, Revenue this month, Revenue
last month (with vs-last delta); Recent activity feed (delivery sends
etc.); Upcoming shoots grouped by shooter.

**Bookings** — inbox for PUBLIC booking requests (tabs: Pending /
Confirmed / Rejected / All; search). Fed by the /book wizard.

**Projects** — Pipeline / Board / Table view switcher; filters: Status,
Market, Shooter, Client + search; stacked status groups with counts +
$ totals; rows: checkbox (bulk), address+city, client, market, date,
shooter, payment badge (UNPAID), price, ⋯ menu.
*New Project modal:* address autocomplete (+manual fallback) →
city/state/zip auto-fill; SQFT (required — drives pricing); client
typeahead + inline create; shooter; market; Service package (Essential /
Core / Bespoke / alacarte); grouped addons — package contents shown as
"(included)" and locked; ESTIMATED TOTAL auto-computed
("Core: $1,750 · Addons: $0 · Tier 4–5k sqft") with editable TOTAL
AMOUNT; discount code select; travel fee + note; shoot date/time
pickers; status; payment; Dropbox URL; Frame.io URL; notes; "Show price
in confirmation" toggle.
*Project detail page:* header (address + status + market badges, Edit,
Delete); Project info panel; PAYMENT panel (AWAITING PAYMENT badge,
amount, "payment window expires …", **Generate Stripe Payment Link**,
Mark as paid manually); DELIVERY panel (Create delivery); QUICK ACTIONS
(change status, Open Dropbox folder); Update shoot details (inline,
"IN SYNC" calendar indicator); Activity timeline (stubbed "next phase").

**Clients** — card grid with avatar initials, market tag, brokerage,
email, project count, ⋯ menu, View; search + Active filter; New client.

**Team** — shooters (assignment target in projects + dashboard grouping).

**Deliveries** — card grid with photo covers; All / Draft / Sent tabs;
shooter filter; sort; search; per card: address, SENT badge (+ version
V2/V3), city, client, file count, sent date, send count (e.g. "8×");
bulk checkboxes; New Delivery.

**Messages** — per-project client threads; inbox with unread badges;
reply box ("visible admin-side only for now").

**Settings** — Pricing editor: per MARKET tabs; per package (Essential/
Core/Bespoke): price per sqft tier (0–2k, 2–3k, 3–4k, 4–5k, 5–6k, 6k+),
duration minutes, "includes twilight" flag, deliverables list. Observed
Visaro Bay Area numbers: Essential 850/950/1050/1150/1250/1350 · 90min;
Core 1450/1550/1650/1750/1850/2000 · 120min · twilight included.
Discount codes manager. Email signature (120 chars). Turnaround days
(injected into confirm email). Bookings paused toggle.

**/book (public wizard)** — 4 steps: Market → Service → Property →
Review. Branded, computes price, submits a Pending booking request.

---

## 2. Already built in the JCS admin

Login/auth · sidebar shell · Dashboard (stats, This week, Recent
activity) · Projects pipeline (stacked groups + Board, search, client
filter, drag-drop, ›-advance) · project detail pages · clients CRUD +
detail · Visaro-style create form (structured address+sqft, client
typeahead-lite + inline create, addons→deliverables, travel fee,
show-price toggle, twilight slot) · confirm flow (branded emails,
client Add-to-Calendar button, direct Google Calendar write w/
"Client - Service" events) · Deliveries page (link-based) · Portfolio.

## 3. Build phases (remaining)

**A. Pricing engine + settings** — /admin Settings view: JCS packages
(needs Jacob's package names, tiers, prices, durations, deliverables),
sqft-tier auto-pricing in the create form + estimated-total box,
discount codes, turnaround days, email signature. Single market.
**B. Payments (Stripe)** — payment status separate from pipeline stage
(UNPAID/PAID badges), Generate Payment Link, payment window, mark paid,
webhook to auto-mark paid. Requires Jacob's Stripe account + keys.
**C. Public booking wizard** — jacobcschrader.com/book, JCS-branded
(serif, paper-white instead of Visaro black): Service → Property →
Review (market step unnecessary), price computed from settings,
submits to a Bookings inbox (Pending/Confirmed/Rejected) with
approve→becomes project + confirmation flow. Discount codes.
**D. Deliveries v2** — cover thumbnails, Draft→Sent lifecycle,
versions, send-count, branded delivery email to client with links,
resend; bulk actions.
**E. Messages** — per-project threads (email-reply ingestion is the
hard part; start admin-side notes + outbound email).
**F. Polish** — Table view + bulk ops on projects, address autocomplete
(needs Mapbox/Google Places key), Dropbox folder integration, activity
timeline, revenue-vs-last-month delta + global search on dashboard.

## 4. Needed from Jacob

1. JCS package definitions: names, what's included, price per sqft
   tier, durations, twilight inclusion (may differ from Visaro's).
2. Stripe account (Phase B) — he creates it; keys go in env vars.
3. Decision: address autocomplete now (API key) or later.
4. Cleanup: delete "123 Test Street" test project in Visaro; delete
   "Test Client (delete me)" in the JCS admin.
