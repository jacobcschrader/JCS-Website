// =====================================================================
//  GET /api/admin/portallink?id=<clientId> — mint a 30-day portal
//  sign-in URL for a client (admin only). Used by the client page's
//  "Open portal" button so Jacob can preview any client's dashboard.
// =====================================================================
const { requireAuth } = require("../auth.js");
const { loginUrl } = require("../portal-auth.js");

module.exports = function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const id = parseInt((req.query || {}).id, 10);
  if (!id) { res.status(400).json({ error: "invalid" }); return; }
  res.status(200).json({ url: loginUrl(id) });
};
