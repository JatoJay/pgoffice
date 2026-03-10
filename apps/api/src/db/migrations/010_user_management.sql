ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_invitations_tenant ON user_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_invitations_tenant_isolation') THEN
    CREATE POLICY user_invitations_tenant_isolation ON user_invitations
      USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
      WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());
  END IF;
END $$;

INSERT INTO role_templates (key, name, description, permissions)
VALUES
  ('admin', 'Administrator', 'Full access to all features', '{"users": ["read", "write", "delete"], "projects": ["read", "write", "delete"], "documents": ["read", "write", "delete"], "settings": ["read", "write"]}'::jsonb),
  ('manager', 'Project Manager', 'Manage projects and tasks', '{"users": ["read"], "projects": ["read", "write"], "documents": ["read", "write"], "settings": ["read"]}'::jsonb),
  ('member', 'Team Member', 'View and contribute to projects', '{"users": ["read"], "projects": ["read"], "documents": ["read", "write"], "settings": []}'::jsonb),
  ('viewer', 'Viewer', 'Read-only access', '{"users": ["read"], "projects": ["read"], "documents": ["read"], "settings": []}'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = now();
