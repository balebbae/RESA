DROP TRIGGER IF EXISTS set_user_timestamp ON users;
DROP FUNCTION IF EXISTS update_user_timestamp;

ALTER TABLE users DROP COLUMN IF EXISTS password_hash;