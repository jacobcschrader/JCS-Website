// =====================================================================
//  DATABASE — Neon Postgres over HTTP (works in Vercel functions).
//
//  Setup (one time): Vercel → Storage → Create Database → Neon →
//  connect it to this project. That injects DATABASE_URL automatically.
//
//  The schema is created on first use (idempotent), so there is no
//  separate migration step. Add new tables here as the admin grows.
// =====================================================================

const { neon } = require("@neondatabase/serverless");

let _sql = null;
function sql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

let _ready = null;
function ensureSchema() {
  if (!_ready) {
    _ready = (async () => {
      const s = sql();
      await s`CREATE TABLE IF NOT EXISTS clients (
        id         serial PRIMARY KEY,
        name       text NOT NULL,
        email      text DEFAULT '',
        phone      text DEFAULT '',
        brokerage  text DEFAULT '',
        notes      text DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      await s`CREATE TABLE IF NOT EXISTS bookings (
        id         serial PRIMARY KEY,
        client_id  integer REFERENCES clients(id) ON DELETE SET NULL,
        title      text NOT NULL,
        location   text DEFAULT '',
        shoot_date date,
        shoot_time text DEFAULT '',
        type       text DEFAULT '',
        price      numeric,
        status     text NOT NULL DEFAULT 'upcoming',
        notes      text DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      // Pipeline upgrade: delivery fields + status rename (idempotent).
      await s`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_url text DEFAULT ''`;
      await s`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivered_at date`;
      await s`UPDATE bookings SET status = 'upcoming' WHERE status = 'scheduled'`;
      // Twilight slot + booking confirmation (idempotent).
      await s`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS twilight_date date`;
      await s`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS twilight_time text DEFAULT ''`;
      await s`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_at timestamptz`;
      await s`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deliverables text DEFAULT ''`;
    })();
  }
  return _ready;
}

// Every route should call: const s = await db();
async function db() {
  await ensureSchema();
  return sql();
}

module.exports = { db };
