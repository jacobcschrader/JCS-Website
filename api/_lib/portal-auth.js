// =====================================================================
//  Client-portal auth: HMAC-signed tokens (SESSION_SECRET) for
//  sign-in links ("portal-login") and session cookies ("portal-session").
//  Token format: <clientId>.<expiresEpochSec>.<sig>
// =====================================================================
const crypto = require("node:crypto");

const COOKIE = "jcs_portal";
const DAY = 24 * 60 * 60;

function secret() {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is not configured");
  return process.env.SESSION_SECRET;
}
function sign(payload, kind) {
  return crypto.createHmac("sha256", secret()).update(kind + ":" + payload).digest("base64url");
}
function makeToken(clientId, kind, maxAgeSec) {
  const payload = `${clientId}.${Math.floor(Date.now() / 1000) + maxAgeSec}`;
  return `${payload}.${sign(payload, kind)}`;
}
function verifyToken(token, kind) {
  const m = /^(\d+)\.(\d+)\.([\w-]+)$/.exec(String(token || ""));
  if (!m) return null;
  const payload = `${m[1]}.${m[2]}`;
  const expect = sign(payload, kind);
  if (expect.length !== m[3].length ||
      !crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(m[3]))) return null;
  if (parseInt(m[2], 10) < Math.floor(Date.now() / 1000)) return null;
  return parseInt(m[1], 10);
}
function readCookie(req) {
  const raw = String(req.headers.cookie || "");
  const m = raw.match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]+)"));
  return m ? m[1] : "";
}
// A 30-day sign-in URL — only ever place this in email to the client
// (or hand it to Jacob from the authed admin).
function loginUrl(clientId, projectId) {
  return `https://www.jacobcschrader.com/api/portal?login=${makeToken(clientId, "portal-login", 30 * DAY)}` +
    (projectId ? `&p=${projectId}` : "");
}

module.exports = { COOKIE, DAY, makeToken, verifyToken, readCookie, loginUrl };
