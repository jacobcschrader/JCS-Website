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
- **Email** — every page uses `jacob@thevisaro.com`. Confirm that's the address
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
   jacob@thevisaro.com (contact.html). ⚠️ One-time step: the first submission
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
