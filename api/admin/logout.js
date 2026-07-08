// POST /api/admin/logout → clears the session cookie.
const { clearCookie } = require("../_lib/auth.js");

module.exports = function handler(req, res) {
  res.setHeader("Set-Cookie", clearCookie());
  res.status(200).json({ ok: true });
};
