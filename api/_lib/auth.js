// =====================================================================
//  ADMIN AUTH — single-user email/password with signed session cookie.
//
//  Env vars (Vercel → Settings → Environment Variables):
//    ADMIN_EMAIL          the login email
//    ADMIN_PASSWORD_HASH  produced by: node tools/hash-password.mjs
//    SESSION_SECRET       any long random string (32+ chars)
//
//  How it works: password is verified against a scrypt hash (never
//  stored in plain text); on success an HMAC-signed, HttpOnly cookie
//  is issued for 7 days. Every admin API route calls requireAuth().
// =====================================================================

const crypto = require("node:crypto");

const COOKIE = "jcs_session";
const SESSION_DAYS = 7;

// ---- password hashing (scrypt) --------------------------------------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

// ---- session tokens (HMAC-signed, stateless) ------------------------
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not configured");
  return s;
}

function sign(data) {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_DAYS * 864e5 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token) {
  const [payload, sig] = String(token || "").split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now();
  } catch { return false; }
}

// ---- cookie helpers --------------------------------------------------
function sessionCookie(token) {
  const maxAge = SESSION_DAYS * 86400;
  return `${COOKIE}=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function clearCookie() {
  return `${COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function readCookie(req) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === COOKIE) return v.join("=");
  }
  return null;
}

// ---- route guard ------------------------------------------------------
// Usage at the top of every admin API route:
//   if (!requireAuth(req, res)) return;
function requireAuth(req, res) {
  if (verifySessionToken(readCookie(req))) return true;
  res.status(401).json({ error: "unauthorized" });
  return false;
}

module.exports = {
  hashPassword, verifyPassword,
  createSessionToken, verifySessionToken,
  sessionCookie, clearCookie, readCookie, requireAuth,
};
