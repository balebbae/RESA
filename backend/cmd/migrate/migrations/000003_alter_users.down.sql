-- Remove the trigger first to avoid dependency issues
DROP TRIGGER IF EXISTS set_user_timestamp ON users;
DROP FUNCTION IF EXISTS update_user_timestamp;

-- Remove the password_hash column
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
