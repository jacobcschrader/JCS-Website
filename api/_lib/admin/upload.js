// =====================================================================
//  POST /api/admin/upload — Vercel Blob client-upload broker (auth req.)
//  The browser uploads media STRAIGHT to Blob storage (no 4.5MB function
//  limit); this endpoint only authenticates the request and issues the
//  short-lived client token. Requires a Blob store connected to the
//  project (Vercel → Storage → Blob), which injects BLOB_READ_WRITE_TOKEN.
// =====================================================================
const { requireAuth } = require("../auth.js");
const { handleUpload } = require("@vercel/blob/client");

module.exports = async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") { res.status(405).json({ error: "method-not-allowed" }); return; }
  // Newer stores authenticate via BLOB_STORE_ID + Vercel OIDC instead of
  // a BLOB_READ_WRITE_TOKEN env — accept either.
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    res.status(500).json({ error: "blob-not-configured" });
    return;
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"],
        maximumSizeInBytes: 500 * 1024 * 1024,
        addRandomSuffix: true,
        cacheControlMaxAge: 31536000,
      }),
      // Fire-and-forget: nothing to do after upload — the editor sends
      // the final URLs with the project save.
      onUploadCompleted: async () => {},
    });
    res.status(200).json(jsonResponse);
  } catch (e) {
    res.status(400).json({ error: String((e && e.message) || "upload-error") });
  }
};
