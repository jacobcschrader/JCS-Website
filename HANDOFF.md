# Jacob Schrader — Website Handoff

A handoff for taking this site live on **Vercel**. Hand this whole file to a new
Claude chat (or any developer) and they'll have everything they need.

---

## 1. What this is

A personal/business website for **Jacob Schrader** — a real estate,
architecture, and design photographer + videographer. It's a **static website**:
plain HTML, CSS, and JavaScript. **No backend, no database, no build step, no
dependencies.** Every page is a file you can open in a browser.

Brand: white + deep navy (`#0f2240`), serif display type (Cormorant Garamond) +
sans body (Inter), elegant/editorial. Fonts load from Google Fonts. The brand
monogram is **"JCS"** (serif italic), used in the nav and footer.

**Goal of the next step:** host it on Vercel at a custom domain.

---

## 2. Pages

| File | Page | Notes |
|------|------|-------|
| `index.html` | Home | Hero, projects carousel, clients marquee, press, testimonials, CTA |
| `about.html` | About | "Meet Jacob" intro, bio, recognition, CTA |
| `projects.html` | Projects | Gallery grid of all projects (built from `projects-data.js`) |
| `project.html` | Project detail | One shared template; opened as `project.html?slug=…` |
| `architecture.html` | Architecture | Photography services (agents / architects / builders / designers) |
| `films.html` | Films | Horizontal films + vertical reels (autoplay-muted, mute button) |
| `design.html` | Design | Web + design services + "Selected work" showcase |
| `contact.html` | Contact | Editorial split: intro/details + enquiry form |

**Shared assets**
- `styles.css` — all styling (one file, shared by every page).
- `site.js` — all behavior: sticky nav, mobile menu, scroll reveals, the
  projects carousel, autoplay-muted video + mute button, custom cursor, hero
  parallax, first-load intro animation.
- `projects-data.js` — the list of projects (see §4).

Navigation order: Home · About · Projects · Architecture · Films · Design · Contact.

---

## 3. There is no backend (by design)

Earlier versions had an admin/CMS and a Supabase/Stripe backend. **All of that
was removed** — this is now purely a static marketing site. Nothing to configure,
no API keys, no server. To change content you edit the files directly (below).

---

## 4. How to edit content

**Projects** — edit `projects-data.js`. Each project is an object:

```js
{
  slug: "toro-canyon",                 // used in the URL: project.html?slug=toro-canyon
  title: "420 Toro Canyon Road",
  location: "Montecito, CA",
  year: "2026",
  headline: "Santa Ynez Designer Home",// shown above the description
  summary: "A short paragraph…",
  shot_for: "Ricardo Munoz",           // "Shot for" credit
  brokerage: "Berkshire Hathaway",
  cover_url: "images/toro-cover.jpg",  // full-width hero image
  gallery: ["images/toro-1.jpg", "images/toro-2.jpg"],  // photo grid
  horizontal_video: "videos/toro-film.mp4",   // optional 16:9 film (autoplay muted + mute button)
  vertical_video:   "videos/toro-reel.mp4"     // optional 9:16 reel
}
```

Add/remove/reorder objects in this array and the home carousel, the projects
grid, and each project page update automatically. Leave a field as `""` (or
`[]`) to hide it. The project page supports three looks: photos only, photos +
horizontal film, or photos + horizontal + vertical.

**Page copy** — edit the text directly inside each `.html` file.

**Photos & videos** — create `images/` and `videos/` folders next to the HTML
files and reference them by path (e.g. `images/hero.jpg`, `videos/hero.mp4`).
Any element with `data-video="…"` autoplays muted and loops, with a mute button.

---

## 5. Replace before / soon after launch (placeholders)

- **Photos & videos** — none are included yet. The dark gradient boxes are
  placeholders. Add real `images/` and `videos/` files. Referenced filenames the
  pages already expect: `videos/hero.mp4` (home hero), `videos/showreel.mp4`
  (films hero), plus the films-page cut/reel clips. Films/projects use **direct
  video files** (no Vimeo/YouTube embeds).
- **Project content** — the six projects in `projects-data.js` have titles +
  locations only; add covers, galleries, copy, and films.
- **Email** — every page uses `jacxbschrader@gmail.com`. Confirm that's the address
  you want, or swap it (it's the old "Visaro" address). Search/replace across
  files if changing.
- **Instagram** — the footer + contact "Instagram" links point to `#`. Put in
  the real profile URL.
- **Contact form** — it only shows a thank-you message; it does **not** send
  email yet. Wire it to a form service (e.g. **Formspree**, **Web3Forms**, or a
  Vercel serverless function). See §7.
- **Design page "Selected work"** — placeholder tiles + the "Sold in 6 days,
  over asking" result line; replace with real work and outcomes.
- **Testimonials / press / clients** — these are realistic samples; confirm
  they're accurate before publishing.
- **Phone** — `(408) 824-8719` is set across the site (this is real per the
  owner; confirm).
- **Favicon + social preview image** — none yet; add a favicon and an OpenGraph
  image for nice link previews (see §7).

---

## 6. Deploy to Vercel (the main task)

The site is static, so Vercel needs **no build settings** — it just serves the
files. Three ways, easiest first:

### Option A — Drag & drop (fastest, no account setup beyond signup)
1. Go to **https://vercel.com** and sign up (free Hobby plan).
2. Put all the site files (`index.html`, `styles.css`, etc.) in one folder.
3. Use Vercel's deploy — the simplest path is to push to GitHub (Option B), but
   you can also use the Vercel CLI (Option C) to deploy a plain folder.

### Option B — GitHub (recommended; gives auto-deploys on every edit)
1. Create a new GitHub repository and upload all the site files to it (keep the
   flat structure — `index.html` at the repo root).
2. In Vercel: **Add New… → Project → Import** that GitHub repo.
3. Framework preset: **Other** (it's plain static). Build command: **none/empty**.
   Output directory: **leave as root** (`.`). Click **Deploy**.
4. Vercel gives you a live URL like `your-project.vercel.app`. Every push to the
   repo redeploys automatically.

### Option C — Vercel CLI (deploy a folder directly)
1. Install: `npm i -g vercel`
2. From inside the site folder: `vercel` (first run links/creates the project),
   then `vercel --prod` to publish. Accept the defaults — no build step.

> No `vercel.json` is required. If one is ever added, it should NOT set a build
> command; this is a static site served as-is.

### Custom domain
In the Vercel project → **Settings → Domains** → add your domain (e.g.
`jacobschrader.com`) and follow Vercel's DNS instructions (either change your
registrar's nameservers to Vercel, or add the A/CNAME records it shows). HTTPS is
automatic.

---

## 7. Nice-to-haves after it's live

- **Working contact form (Formspree, ~5 min):** create a form at formspree.io,
  then in `contact.html` change the `<form>` to
  `action="https://formspree.io/f/XXXX" method="POST"` and remove the
  `onsubmit="…"` handler (or keep a success message). Give each input a `name`
  (most already have one).
- **Favicon:** add `favicon.ico` / a PNG and a `<link rel="icon" …>` in each
  page's `<head>`.
- **Social/OG preview image:** add `<meta property="og:image" …>` (and a
  1200×630 image) so shared links look good. Titles/descriptions already exist.
- **Analytics:** Vercel Analytics (one toggle in the dashboard) or Plausible/GA.
- **Sitemap/robots:** optional `sitemap.xml` + `robots.txt` for SEO.
- **Compress media:** keep hero/film files reasonably sized so pages load fast
  (consider 1080p, H.264 MP4; large 4K files will feel slow).

---

## 8. Quick prompt for the next Claude chat

> "I have a finished static website (plain HTML/CSS/JS, no backend) for a
> photographer. I want to deploy it to Vercel with a custom domain, wire up the
> contact form, and add a favicon + social preview image. Here's the handoff
> doc: [paste this file]. Walk me through it step by step."

---

*Everything is plain files — open `index.html` in a browser to preview locally
(some video autoplay may behave better once hosted). Nothing else is required to
run it.*

---

## 11. July 2026 — client-experience upgrades (Claude session)

1. **Contact form now really sends** — POSTs via FormSubmit AJAX to
   jacxbschrader@gmail.com (contact.html). ⚠️ One-time step: the first submission
   triggers a FormSubmit activation email to that address — click the link in
   it once, and all later enquiries arrive normally. Honeypot spam trap included.
2. **Social link previews** — every page has Open Graph/Twitter tags
   (default share image: `images/og/og-default.jpg`, 1200×630). Per-project
   previews: `tools/generate-share-pages.mjs` writes a static copy of
   project.html per finished project into `p/` with that project's
   title/cover baked in, and `vercel.json` rewrites `/project?slug=…` to it.
   **Re-run `node tools/generate-share-pages.mjs` whenever projects-data.js
   or project.html changes.**
3. **Gallery lightbox** — click any project photo for a fullscreen viewer
   (arrows / keyboard / swipe, counter). Code: `JSLightbox` in site.js +
   `.lb` styles in styles.css.
4. **Lazy loading** — project galleries (first 8 photos eager, rest lazy),
   projects grid, home carousel. The justified layout now re-lays-out as lazy
   photos arrive (placeholder ratio 1.5 until measured).
5. **Drafts hidden** — `draft: true` in projects-data.js hides a project from
   the carousel/grid (direct URL still works). All six sample projects are
   drafts; only 9290 Brae Road is public. Remove the flag as real projects land.
   Carousel supports a single slide (no arrows/autoplay until ≥2 projects).
6. **Films page cleaned** — fake cuts/reels commented out until real videos
   exist; the three real films got poster frames (`images/posters/`,
   via `data-poster`). Vertical Reels section is commented out entirely.
7. **Responsive heroes** — home + architecture heroes use `srcset`
   (1280/1920/2560/3840w, generated at q82); phones now pull ~190–360KB
   instead of ~2.4–2.8MB.
8. **184 Tiburon Bay** — folder set to "" (no more 404 cover); it's also a draft.

### Update: contact form now uses Resend (with FormSubmit fallback)

`api/contact.js` is a Vercel serverless function that emails enquiries via
Resend. To activate: create a Resend account → make an API key → Vercel →
Settings → Environment Variables → `RESEND_API_KEY` → redeploy. Optional:
verify jacobcschrader.com at resend.com/domains, then set
`CONTACT_FROM = JCS Website <enquiry@jacobcschrader.com>`.
Until the key is set (or if Resend ever fails), the form automatically
falls back to FormSubmit, so no enquiry is lost. Replies go straight to
the enquirer thanks to reply-to.

### Update 2: dynamic project page renamed + canonical host

- `project.html` → **`project-view.html`**. Reason: Vercel serves real files
  before rewrites, so while project.html existed, the per-project share pages
  in `p/` were never served. `/project?slug=…` URLs are unchanged — vercel.json
  now rewrites them to the right `p/` stub (finished projects) or to
  project-view.html (drafts/unknown). Don't recreate a file named project.html.
- All canonical/OG URLs now use https://www.jacobcschrader.com (the apex
  domain 308-redirects to www).

### Update 3 (FINAL project-URL scheme): static pages, no rewrites

Vercel silently ignored the query-based rewrites, which 404'd /project?slug=…
after the rename. Fixed for good by dropping rewrites entirely:

- The dynamic page is back at its original name, **project.html**
  (serves /project?slug=… — now only used for previewing drafts).
- Finished projects get REAL static pages: `tools/generate-share-pages.mjs`
  writes `project/<slug>.html` (own OG tags + `<base href="/">`), served at
  **/project/<slug>** thanks to cleanUrls. The whole site (carousel, grid,
  prev/next) links there. `p/` folder is gone; vercel.json has no rewrites.
- As before: re-run `node tools/generate-share-pages.mjs` after changing
  projects-data.js or project.html.

### Update 4: Resend is now the ONLY email path (FormSubmit removed)

- `api/_lib/email.js` — shared email layer. ALL future site email (any new
  function) must go through its `sendEmail()`; `brandedHtml()` gives the
  navy/JCS email template.
- `api/contact.js` — sends the enquiry to Jacob (reply-to = enquirer) AND a
  branded auto-reply confirmation to the enquirer (non-fatal if it fails).
- Required setup in Vercel env vars: `RESEND_API_KEY`.
- For the auto-reply to actually deliver (and for best inbox placement),
  verify the domain at resend.com/domains and set
  `CONTACT_FROM = Jacob Schrader <enquiry@jacobcschrader.com>`.
- No FormSubmit fallback anymore: if Resend fails, the visitor is shown an
  error asking them to email directly.

---

## 12. Studio Admin (Phase 1) — jacobcschrader.com/admin

Password-protected business dashboard: projects overview, clients, and
bookings. Phase 2 (planned): invoices (branded email + mark-paid) and
gallery delivery emails.

**Files:** `admin.html` (UI, served at /admin, noindex),
`api/admin/{login,logout,me,clients,bookings}.js`,
`api/_lib/auth.js` (scrypt + HMAC session cookie, 7 days),
`api/_lib/db.js` (Neon Postgres, schema auto-created),
`tools/hash-password.mjs`, `package.json` (@neondatabase/serverless).

**One-time setup (Jacob):**
1. Vercel → project → **Storage → Create Database → Neon** (free) →
   connect to the project. This injects `DATABASE_URL` automatically.
2. Double-click `tools/hash-password.html` (opens in the browser, no
   install needed), type a password, copy the hash. (`tools/hash-password.mjs`
   does the same from Terminal if Node is installed.)
3. Vercel env vars (Settings → Environment Variables):
   - `ADMIN_EMAIL` = jacxbschrader@gmail.com
   - `ADMIN_PASSWORD_HASH` = (the hash from step 2 — NOT the password)
   - `SESSION_SECRET` = any long random string (e.g. 40 random characters)
4. Redeploy. Log in at jacobcschrader.com/admin.

**Notes:** single admin user by design. Sessions are stateless signed
cookies; changing SESSION_SECRET logs out everywhere. Tables:
`clients`, `bookings` (see db.js). Projects tab reads projects-data.js —
project publishing still goes through the normal Claude workflow.

### Admin update: twilight slot, confirm flow, Google Calendar

- Projects have a second time slot: `twilight_date` (blank = same day) +
  `twilight_time`. Times are real time-pickers now (needed for calendar).
- **Confirm & send** button on a project detail page: emails a branded
  confirmation to the client (+ copy to Jacob), both with a .ics invite
  containing the shoot and twilight events (America/Los_Angeles).
  Stamps `confirmed_at`; cards show "✓ confirmed". Re-clicking resends
  and updates (calendar events upsert by stable ID — no duplicates).
- **Direct Google Calendar write** (api/_lib/gcal.js): if
  `GOOGLE_SA_KEY` (service-account JSON) + `GCAL_CALENDAR_ID` env vars
  are set, confirming also writes both events straight onto Jacob's
  calendar — nothing to accept. Setup steps are documented at the top of
  gcal.js. Without those vars it silently falls back to invite-only.

### Confirm flow refinements (Visaro-style calendar events)

- New `deliverables` field on projects (client-facing list, e.g. "HDR
  photography · Drone photos …"); `notes` is now labeled "Access notes"
  (internal — Jacob's calendar only).
- Jacob's calendar event: title "Client - Service", location = full
  property address, description = Package / Property / Client (phone) /
  Price, then Deliverables and Access notes, plus admin deep link.
- Clients are NOT sent a calendar invite. Their confirmation email has
  an "Add to Calendar" button → signed public endpoint
  `/api/calendar?id&sig` (HMAC via SESSION_SECRET) serving the client
  version of the .ics (no price/notes). Google quick-add links included.
- Jacob's copy keeps the .ics attachment as a fallback when the direct
  Google Calendar write isn't configured.

### Create-project form (Visaro-style)

Rebuilt to mirror The Visaro's New Project modal, adapted for JCS:
structured address (street/city/state/zip/sqft — location string is
derived), client select with inline "+ New" client creation, Service
dropdown, grouped Addons checkboxes (Photography/Videography/Universal,
trimmed premium list in admin.html ADDONS) that auto-compose the
Deliverables text, manual Price + Travel fee/note, twilight slot,
delivery link, access notes, and a "Show price in confirmation" toggle
(hides the Total row in the client's confirmation email when off).
New bookings columns: city, state, zip, sqft, addons(json), travel_fee,
travel_note, show_price. No pricing engine by choice — price is manual.

### Work-with-me application flow (/book)

JCS takes custom quotes — so instead of Visaro's self-serve booking
wizard, /book is an "apply to work with me" flow:

- `book.html` — public, JCS-branded 3-step wizard (You → The property →
  The work): contact, address/sqft, target date, services of interest,
  message. Honeypot included. Submits to `api/book.js`, which stores a
  pending request, emails Jacob (with "Review in admin" button) and a
  branded "Application received" note to the applicant.
- Admin → **Requests** (sidebar, with red pending-count badge; also a
  Pending Requests stat on the dashboard): tabs Pending/Accepted/
  Declined/All. **Accept** matches-or-creates the client by email and
  creates a prefilled project (services → deliverables, target date →
  shoot date, status upcoming) then opens it — Jacob sets the custom
  quote and uses Confirm & send. **Decline** sends a graceful branded
  "fully committed" email. `api/admin/requests.js`, `requests` table.
- No pricing engine anywhere, by design (custom quotes only).

Site CTAs still point at /contact — link /book from the site when ready.

### Settings tab + discount codes

- Admin sidebar gained **Settings** with a Discount Codes card: create
  (code, percent-off or dollar-off, value, note), activate/deactivate,
  delete. `api/admin/discounts.js`, `discounts` table.
- Project form has a **Discount code** select (active codes only; an
  inactive code already on a project stays selectable there). Works on
  new AND existing projects.
- The discount is snapshotted in dollars at save time
  (`discount_code` + `discount_value` on bookings) — editing or deleting
  a code later never changes past projects. Dollar-off is capped at the
  project price; percent computed server-side.
- Where it shows: project detail (Discount + Total rows), client
  confirmation email (Discount line + reduced Total, respecting the
  show-price toggle), Jacob's calendar description, and dashboard
  revenue stats (now net of discounts).

### Branded delivery flow (A+)

How it works: paste the Pixieset gallery link (and optionally a
Dropbox/Drive download link for films) into the project via Edit, then
hit **Send delivery to client** on the project page. The client gets a
branded "Your delivery is ready" email whose button opens a JCS-branded
delivery page at `/delivery?t=<token>` — property title, deliverables,
View Gallery + Download Films & Files buttons. No invite to Pixieset's
branding first; JCS front door always.

- `delivery.html` — the public page (noindex; fetches `/api/delivery`).
- `api/delivery.js` — public, token-gated; returns client-safe fields
  only (no price, no access notes). Tokens are random, issued on first
  send, stable across resends.
- `api/admin/deliver.js` — sends the email, stamps
  `delivery_sent_at`/`delivery_sends`/`delivered_at`, and auto-advances
  the stage to Delivered if the project was still Upcoming/Editing/
  Revisions (later stages untouched).
- Project form gained a **Download link (films / zip)** field.
- Project detail Delivery card: Send/Resend button, gallery/download/
  preview-page links, "✓ Sent Jul 10 · 2×" state.
- Deliveries page cards show sent status + a Delivery page link.
- Guards: needs a gallery link and a client with an email.

### Serverless function consolidation (Vercel Hobby 12-function cap)

The delivery deploy failed: Hobby allows max 12 serverless functions and
we hit 13. Fixed by consolidating:

- All nine admin endpoints moved to `api/_lib/admin/` (Vercel ignores
  `_lib`) behind ONE dynamic route: `api/admin/[action].js`. URLs are
  unchanged (`/api/admin/bookings` etc. — `[action]` catches them), so
  no front-end changes were needed.
- Deleted `api/contact.js` — dead since /contact became the application
  wizard posting to `/api/book`.
- Function count is now 4 (`admin/[action]`, `book`, `calendar`,
  `delivery`) — lots of headroom for Stripe etc.

### Project page: Visaro-style info grid + delivery modal

- Project detail main column is now one "Project info" card matching
  Visaro's grid: Property / City, State / Square footage / Service /
  Shoot date (+time) / Twilight (when set) / Total amount / Payment
  (Paid-Unpaid badge) / Client (with brokerage) — no shooter/duration/
  Frame.io by design. Deliverables + access notes below.
- Actions card gained a Change stage dropdown (Visaro quick action).
- Delivery card: "Create delivery" opens a small modal (gallery link,
  download link, delivered-on) instead of the full Edit form; after
  creation it becomes Send/Resend + Edit delivery + links.

### Delivery editor (Visaro-style page, no uploads)

Creating a delivery now opens a full editor at `#delivery/:id` instead
of a modal (Create/Open delivery from the project page or Deliveries):

- Header: property title, Draft/Sent badge, client + email, and
  Preview as client / Save / Publish & send.
- **Delivery settings**: message to client (goes in the email), CC
  recipients (comma-separated, validated server-side, max 10),
  delivered-on date.
- **Links**: named link rows — title + URL — with "+ Add link" for as
  many as needed (Gallery, Cinematic Film, Zillow 3D Tour, whatever).
  Each becomes a button on the client's delivery page and replaces the
  old fixed gallery/download pair (legacy fields still fall back).
- Publish & send saves first, then emails client + CCs.
- New booking columns: delivery_message, delivery_cc, delivery_links
  (validated JSON). Tokens now issue when a delivery is saved, so
  Preview as client works before sending.
- Delivery fields were removed from the project Edit modal (project
  edits merge over the booking so delivery data survives).

### Client page (Visaro-style) + multiple emails per profile

- Client detail rebuilt like Visaro's: avatar initials + name header
  (brokerage, email · phone), Edit client/Delete; left = Projects card
  with count and Visaro-style rows (property/location · date, Paid or
  Unpaid badge, total, stage badge) + Notes card; right rail = Emails
  card and Contact info (phone, brokerage, date added, total revenue —
  net of discounts, incl. travel).
- **Emails card**: primary address (Primary chip) plus co-recipient
  emails — add with the input + Add (or Enter), remove with ×. Stored
  as validated JSON in clients.extra_emails (deduped vs primary, max
  10). EVERY client notification — booking confirmation and delivery —
  now goes to all addresses on the profile (shared recipientsOf() in
  api/_lib/links.js; confirm.js + deliver.js select extra_emails).
- Client Edit modal preserves extras (passes extra_emails through).

### Draft deliveries + invoices

**Draft deliveries.** Hitting Create delivery now stamps
delivery_created_at, so the draft appears on the Deliveries page
immediately with a Draft badge (Sent badge once published). The project
Delivery card shows the same badge, and its send button is "Publish &
send" (only enabled once links exist).

**Invoices.** Payment card on the project page:
- **Generate invoice** (needs a price) issues a token → "View
  invoice →" opens the branded public page at `/invoice?t=…`
  (print-friendly — client can Print / Save as PDF).
- **Send invoice to client** emails every address on the client
  profile: branded email, total + View Invoice button; stamps
  invoice_sent_at / invoice_sends ("✓ Invoice JCS-0007 sent Jul 9").
- Invoice number = JCS-<project id> (JCS-0007). Line items: service
  (+deliverables), travel (+note), discount (code). Paid/Due badge
  follows the project's Paid stage; Payment card header now shows
  Paid/Unpaid too.
- Files: api/_lib/admin/invoice.js (router action 'invoice'),
  api/invoice.js (public, token-gated, client-safe), invoice.html.
  Function count: 5 of 12.

### Client portal (/portal)

Simplified Luma-style portal, no logins — each client gets one private
tokenized link (clients.portal_token, issued automatically with their
first delivery):

- **"View Your Delivery" in the delivery email now lands here** —
  `/portal?c=<token>&p=<project>` — with that delivery as a navy hero
  card up top (its link buttons inline).
- Below: welcome header, stats strip (In production / Delivered /
  $ Outstanding — unpaid sent invoices only), then projects grouped
  In production / Booked / Delivered. Delivered rows link to their
  delivery page; invoiced rows show "Invoice JCS-0007" + Due/Paid chip
  linking to the invoice page.
- Client-facing stages are simplified: upcoming→Booked,
  editing/revisions→In production, delivered/completed/paid→Delivered.
- Files: api/portal.js (public, token-gated, client-safe — prices only
  appear once an invoice was actually sent), portal.html. Admin client
  page → Contact info shows "Open portal →" once the token exists.
  Function count: 6 of 12.

### Client login (magic link, no passwords) + Visaro-style header

- **Header**: every site page now matches The Visaro's layout — brand
  left, nav links centered, muted "CLIENT LOGIN" top-right (→ /portal).
  On mobile it sits beside the hamburger. Verified visually at desktop
  and 390px widths.
- **Login**: /portal without a token shows an email-only sign-in card.
  POST /api/portal { email } → if it matches a client profile (primary
  OR co-recipient email), their portal link is emailed ("Open Your
  Portal"). No accounts, no passwords. Always responds ok — never
  reveals whether an email exists; honeypot field included. Token is
  issued on first login request if the client doesn't have one yet.

### Pixieset auto-draft (Editing → delivery draft)

Pixieset has NO public developer API (only a Lightroom plugin + mobile
app), so collections can't be created programmatically. Instead we
exploit their predictable URLs:

- Settings → **Pixieset** card: set the studio subdomain once
  (e.g. "jacobschrader" → jacobschrader.pixieset.com). Stored in the
  new `settings` table (key/value; api/_lib/admin/settings.js, router
  action 'settings').
- When a project moves to **Editing** (from any path — stage dropdown,
  drag, edit form) and has no delivery links yet, the server prefills
  the delivery draft: predicted gallery link
  `https://<sub>.pixieset.com/<slugified title>/` + draft stamp, so it
  appears on Deliveries immediately.
- Workflow: name the Pixieset collection exactly like the property
  ("123 Main St" — or sync via the Lightroom plugin) and the predicted
  link resolves; adjust it in the delivery editor if it ever differs.
- Custom links are never overwritten; the hook skips projects that
  already have links, and does nothing until the subdomain is set.

### Delivery editor tweaks

- Live edits: the client's delivery page reads the DB fresh on every
  load (no-store), so Save alone updates it — no resend. The editor
  says so once a delivery is sent, and the resend button is now
  "Resend email" to make the distinction clear.
- Publish & send / Resend email no longer show confirm dialogs or
  success alerts — the Sent status updating is the feedback (errors
  still alert).
- Removed the "Delivered on" field from the editor; delivered_at still
  auto-stamps on first send.

### Portal search + newest-first ordering

- Portal: search box above the project sections (address, city,
  service, invoice number; live filter; hidden when a client has
  fewer than 4 projects).
- Ordering is newest shoot date → oldest everywhere: admin pipeline
  rows AND board cards (were ascending), client portal groups (API
  already DESC), client-page project list, and Deliveries.

### Fix: scheme-less delivery links

A link saved as "jacobcschrader.com" (no https://) rendered as a
RELATIVE link on the client page — the browser resolved it against the
delivery page URL, which looked like "the old link still there". Now
https:// is prepended both on save (bookings parseLinks) and on read
(linksOf, covers already-stored and legacy values).

### Per-link Save in the delivery editor

Each link row now has its own Save button — saves the delivery (all
fields) without re-rendering the form, flashes "✓ Live", and the
client's page reflects it immediately.

### Email system redesign (Visaro-structured, JCS-branded)

One template (jcsEmail in api/_lib/email.js) now powers every email:
navy masthead with only the Cormorant-italic JCS wordmark (no tagline),
tracked eyebrow, serif headline "Client · Property", optional note,
hairline label/value detail table, navy button, "Or copy:" link, and a
"CLIENT/ADMIN NOTIFICATION · {event}" footer.

Subjects: `{Property} | {Event}` — Booking Confirmed, Media Delivery,
Delivery Sent (new admin copy), Invoice JCS-0007, New Application,
Application Received, Application Update (decline). Portal magic link:
"Your Client Portal | Jacob Schrader".

Senders (domain verified on Resend, no extra setup):
- enquiry@jacobcschrader.com — confirmations, applications, declines,
  portal links (client-facing)
- delivery@jacobcschrader.com — media deliveries
- billing@jacobcschrader.com — invoices
- admin@jacobcschrader.com — all notifications to Jacob ("JCS Studio")
CONTACT_FROM env is now only a fallback when no sender is passed.
All 8 email paths covered by mock tests (senders, subjects, template).

### Delivery page redesign + client review flow

- delivery.html rebuilt: full-bleed navy hero (eyebrow, big serif
  italic property title, location, delivered date, link buttons — white
  solid first), "Included in your delivery" strip below, then a review
  section, then contact.
- **Client review**: "Happy with everything?" → Approve Delivery
  (stamps delivery_approved_at, admin email "{Property} | Delivery
  Approved") or Request Changes (textarea → saves delivery_feedback,
  moves delivered/completed projects back to Revisions, admin email
  "{Property} | Changes Requested" with the note). Approved state shows
  a green "✓ Delivery approved · date" chip and can be reopened.
- Admin: project Delivery card shows "✓ Client approved {date}" or a
  red "Changes requested" block with the note; Deliveries cards get
  Approved / Changes requested badges. Resending a delivery clears the
  feedback flag.
- api/delivery.js gained POST {t, action: approve|changes, message}.
  New columns: delivery_approved_at, delivery_feedback.

### Client pages: minimal chrome

Delivery, invoice, and portal pages no longer show the site nav (or
"Client Login" — pointless when they're already in). Each gets a
minimal bar (.mnav in styles.css): JCS wordmark + one contextual link —
"← Back to Portal" on delivery/invoice (APIs now return portal_url),
"View the Work →" on the portal. Footers slimmed to brand + contact +
copyright. Delivery bar is white over the navy hero, flips dark on the
invalid-link state.
