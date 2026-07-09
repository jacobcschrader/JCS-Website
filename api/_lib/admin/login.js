// POST /api/admin/login  { email, password } → sets session cookie.
const { verifyPassword, createSessionToken, sessionCookie } = require("../auth.js");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }
  const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH, SESSION_SECRET } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH || !SESSION_SECRET) {
    res.status(503).json({ error: "not-configured" });
    return;
  }

  const b = req.body || {};
  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");

  const ok =
    email === ADMIN_EMAIL.trim().toLowerCase() &&
    verifyPassword(password, ADMIN_PASSWORD_HASH);

  if (!ok) {
    await sleep(800); // slow down brute-force attempts
    res.status(401).json({ error: "invalid-credentials" });
    return;
  }

  res.setHeader("Set-Cookie", sessionCookie(createSessionToken()));
  res.status(200).json({ ok: true });
};
