// =====================================================================
//  SHARE-PAGE GENERATOR — run after changing projects-data.js
//
//      node tools/generate-share-pages.mjs
//
//  Why this exists: project pages are rendered by JavaScript from
//  ?slug=…, but the crawlers that build link previews (iMessage,
//  Instagram, Facebook, Slack…) don't run JavaScript — they'd all see
//  the same generic preview. This script writes one static copy of
//  project.html per finished project into p/, with that project's
//  title, description and cover photo baked into the <head>. It also
//  rewrites vercel.json so /project?slug=<slug> serves the matching
//  copy. Same URL, same page for humans — correct preview for crawlers.
//
//  Drafts (draft: true) and projects without media are skipped.
// =====================================================================
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://jacobcschrader.com";

// --- load RAW_PROJECTS from the browser data file -------------------
const dataSrc = readFileSync(join(root, "projects-data.js"), "utf8");
const sandbox = { window: {} };
new Function("window", dataSrc)(sandbox.window);
const projects = (sandbox.window.PROJECTS_DATA || []).filter(p => !p.draft && p.cover_url);

// --- build one stub per project from project.html -------------------
const template = readFileSync(join(root, "project.html"), "utf8");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
mkdirSync(join(root, "p"), { recursive: true });

const rewrites = [];
for (const p of projects) {
  const title = `${p.title} — Jacob Schrader`;
  const bits = [p.location, p.price].filter(Boolean).join(" · ");
  const desc = `${p.headline || p.title}${bits ? " — " + bits : ""}. Photography & film by Jacob Schrader.`;
  const url = `${BASE}/project?slug=${encodeURIComponent(p.slug)}`;
  const img = `${BASE}/${p.cover_url}`;

  let out = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(">)/, `$1${esc(desc)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(">)/, `$1${esc(url)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${esc(desc)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(">)/, `$1${esc(url)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(">)/, `$1${esc(img)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(">)/, `$1${esc(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(">)/, `$1${esc(desc)}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(">)/, `$1${esc(img)}$2`)
    // cover dimensions vary per project — drop the fixed 1200×630 hints
    .replace(/\n<meta property="og:image:(width|height)" content="\d+">/g, "");

  writeFileSync(join(root, "p", `${p.slug}.html`), out);
  rewrites.push({
    source: "/project",
    has: [{ type: "query", key: "slug", value: p.slug }],
    destination: `/p/${p.slug}.html`
  });
  console.log(`p/${p.slug}.html`);
}

// --- point vercel.json at the stubs ---------------------------------
const vercelPath = join(root, "vercel.json");
const vercel = JSON.parse(readFileSync(vercelPath, "utf8"));
vercel.rewrites = rewrites;
writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + "\n");
console.log(`vercel.json: ${rewrites.length} rewrite(s)`);
