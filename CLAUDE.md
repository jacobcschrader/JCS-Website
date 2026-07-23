# CLAUDE.md — jacobcschrader.com

This repo is the `website/` component of the **JCS Terminal** workspace
(`~/Desktop/JCS Terminal/`); workspace-wide conventions and the brand kit
live at the workspace root.

Read `HANDOFF.md` before non-trivial work — it's the full current-state
reference (architecture, admin, client portal, CMS, email, gotchas).
`docs/CHANGELOG.md` has the chronological build history.

## What this is
Static HTML site + Vercel serverless (Node CommonJS) + Neon Postgres +
Vercel Blob + Resend. No framework, no build step, no tests to run.
Three surfaces: public site, /admin SPA (admin.html), client pages
(portal/delivery/invoice). Owner: Jacob Schrader (jacxbschrader@gmail.com).

## Hard rules
- **Max 12 Vercel functions** (currently 9). New admin endpoints go inside
  `api/admin/[action].js` router + `api/_lib/admin/*.js` — never new
  top-level files under `api/`.
- **Never commit secrets.** Env var values live only in Vercel. The Google
  Places key lives in the DB (admin Settings), not the repo.
- Jacob deploys by pushing via GitHub Desktop — after changes, tell him to
  commit + push. Env-var changes require a redeploy to take effect.
- All email goes through `sendEmail`/`jcsEmail` in `api/_lib/email.js`.
  Reply-to is always Jacob's gmail. Subjects: `{Property} | {Event}`.
- **Public prices live ONLY in `pricing-data.js`** (drives /book and
  /pricing). Never hardcode a price into a page. Rates confirmed by
  Jacob 2026-07-22.
- DB schema is created idempotently in `api/_lib/db.js` — add new
  tables/columns there (CREATE/ALTER IF NOT EXISTS), no migrations.
- After editing RAW_PROJECTS in `projects-data.js`, run
  `node tools/generate-share-pages.mjs`.

## Conventions
- Design tokens at the top of `styles.css`; mobile layer (≤520px) at the
  bottom. Navy #0f2240, Cormorant Garamond + Inter. Admin styles live
  inside `admin.html`.
- Videos use the `data-video` / `data-poster` enhancer in `site.js`
  (`data-nosound` skips the mute button). Media: photos 2400px JPEG q80,
  films 1080p H.264 faststart, reels 720×1280 — stay well under GitHub's
  100MB/file limit.
- Portfolio CMS media uploads go browser→Vercel Blob (public store
  `jcs-website-media`) via `admin-blob.js`; `/api/site-projects` is the
  public feed (no-store) merged into `window.PROJECTS_DATA` at runtime.
- Update `HANDOFF.md` (and append to `docs/CHANGELOG.md`) after meaningful
  changes.

## Watch out
- `$` in `.replace()` replacement strings corrupts price text — see
  `rep()` in tools/generate-share-pages.mjs.
- `.footer a` outranks `.footer__brand` — keep the compound selector.
- Pixieset has no API; gallery links are predicted from
  settings.pixieset_subdomain + slugified title.
