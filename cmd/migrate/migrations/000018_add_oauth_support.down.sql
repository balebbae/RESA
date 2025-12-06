-- Remove OAuth columns from users table
DROP INDEX IF EXISTS idx_users_google_id;

ALTER TABLE users
  DROP COLUMN IF EXISTS avatar_url,
  DROP COLUMN IF EXISTS google_id;

-- Note: We cannot safely restore password NOT NULL constraint
-- as OAuth-only users would have NULL passwords
