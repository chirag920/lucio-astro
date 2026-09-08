-- Evaluation-form submissions. Applied with:
--   npx wrangler d1 migrations apply lucio-inquiries --local   (local dev)
--   npx wrangler d1 migrations apply lucio-inquiries --remote  (production)
--
-- Deliberately minimal: these are work emails from law firms, i.e. personal data. We store what
-- is needed to reply and nothing more — no IP address, no user agent, no tracking identifiers.
-- `country` is the coarse Cloudflare geo hint, kept only for spam triage.
CREATE TABLE IF NOT EXISTS inquiries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  firm       TEXT NOT NULL,
  country    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cheap dedupe/lookup when the same firm submits twice.
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_email      ON inquiries (email);
