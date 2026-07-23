// =====================================================================
//  Vercel Edge Middleware — subdomain router.
//  Runs BEFORE the filesystem, which vercel.json rewrites cannot do, so
//  the branded subdomains serve their pages at the bare root with no
//  path in the URL:
//    form.jacobcschrader.com/            → /book      (URL unchanged)
//    pricing.jacobcschrader.com/         → /pricing   (URL unchanged)
//    proposal.jacobcschrader.com/<slug>  → /proposal  (page reads slug)
//    proposal.jacobcschrader.com/        → www home   (redirect)
//  Everything else (www, assets, /api) passes through untouched.
//  NOTE: this is an Edge Function — it does NOT count against the
//  12-serverless-function cap.
// =====================================================================

export const config = {
  // Run only on extensionless paths (skips styles.css, images, media)
  // and never on /api. Includes "/" itself.
  matcher: ["/", "/((?!api/|.*\\.).*)"],
};

const rewrite = (path, url) =>
  new Response(null, {
    headers: { "x-middleware-rewrite": new URL(path, url).toString() },
  });

export default function middleware(request) {
  const url = new URL(request.url);
  const host = (request.headers.get("host") || "").toLowerCase();

  if (host === "pricing.jacobcschrader.com" && url.pathname === "/") {
    return rewrite("/pricing", url);
  }
  if (host === "form.jacobcschrader.com" && url.pathname === "/") {
    return rewrite("/book", url);
  }
  if (host === "proposal.jacobcschrader.com") {
    if (url.pathname === "/") {
      return Response.redirect("https://www.jacobcschrader.com/", 307);
    }
    return rewrite("/proposal", url);
  }
  // fall through → normal routing
}
