-- v23 redesign: the evaluation form asks only for an email (firm is optional now), and the
-- footer gains a newsletter signup stored in `subscribers`. Run with:
--   npx wrangler d1 migrations apply lucio-inquiries --local    (local dev)
--   npx wrangler d1 migrations apply lucio-inquiries --remote   (production)

-- SQLite can't drop NOT NULL in place; rebuild the table. Data is preserved.
CREATE TABLE inquiries_new (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  firm       TEXT,
  country    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO inquiries_new (id, email, firm, country, created_at)
  SELECT id, email, firm, country, created_at FROM inquiries;
DROP TABLE inquiries;
ALTER TABLE inquiries_new RENAME TO inquiries;
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_email      ON inquiries (email);

-- Same privacy posture as inquiries: no IP, no user agent. UNIQUE so resubscribes are no-ops.
CREATE TABLE IF NOT EXISTS subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  country    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
