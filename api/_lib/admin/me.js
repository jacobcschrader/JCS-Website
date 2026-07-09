// GET /api/admin/me → 200 if the session is valid, else 401.
const { verifySessionToken, readCookie } = require("../auth.js");

module.exports = function handler(req, res) {
  if (verifySessionToken(readCookie(req))) {
    res.status(200).json({ ok: true, email: process.env.ADMIN_EMAIL || "" });
  } else {
    res.status(401).json({ error: "unauthorized" });
  }
};
