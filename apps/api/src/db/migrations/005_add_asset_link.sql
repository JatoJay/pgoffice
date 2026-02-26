-- Add asset_link field to projects and tasks for external media storage links (Google Drive, etc.)

ALTER TABLE projects ADD COLUMN IF NOT EXISTS asset_link TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS asset_link TEXT;
