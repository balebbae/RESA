-- Add OAuth columns to users table
ALTER TABLE users
  ADD COLUMN google_id VARCHAR(255) UNIQUE,
  ADD COLUMN avatar_url TEXT;

-- Make password nullable for OAuth-only users (those who sign up via Google)
ALTER TABLE users
  ALTER COLUMN password DROP NOT NULL;

-- Create index for faster OAuth lookups
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
