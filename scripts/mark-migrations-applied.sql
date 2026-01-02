-- Script to mark all existing migrations as applied
-- Run this with: psql $DATABASE_URL -f scripts/mark-migrations-applied.sql
-- Or copy-paste into your database client

-- Create the migrations tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL UNIQUE,
  created_at bigint
);

-- Mark all migrations as applied (based on drizzle/meta/_journal.json)
-- These are the migration tags from your journal
INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES
  ('0000_eager_gideon', 1761660940932),
  ('0001_strange_warlock', 1762209104815),
  ('0002_stiff_the_phantom', 1762273361698),
  ('0003_chemical_mastermind', 1762304917316),
  ('0004_bizarre_violations', 1762311603879),
  ('0005_shocking_korath', 1762433511089),
  ('0006_good_zaran', 1762439527950),
  ('0007_thankful_purifiers', 1762439698829),
  ('0008_luxuriant_smasher', 1762439770023),
  ('0009_tidy_the_call', 1762523513765),
  ('0010_nostalgic_human_cannonball', 1762611491574),
  ('0011_useful_the_enforcers', 1762963675265),
  ('0012_remarkable_ronan', 1764822831151),
  ('0013_outgoing_sumo', 1764928015659),
  ('0014_petite_lady_ursula', 1767159995551)
ON CONFLICT (hash) DO NOTHING;

-- Verify
SELECT COUNT(*) as total_migrations FROM "__drizzle_migrations";

