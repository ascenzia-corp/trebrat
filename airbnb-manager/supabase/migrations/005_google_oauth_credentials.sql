-- Add OAuth client credentials to settings for token refresh
ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_client_id TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_client_secret TEXT;
