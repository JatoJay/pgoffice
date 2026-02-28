-- Migration: Restructure Projects to be Instance-centric with AI features
-- Flow: Instance -> Project -> Tasks + Budget (AI-generated)

-- Step 1: Add instance_id to projects (direct link, not through programs)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS instance_id UUID REFERENCES instances(id) ON DELETE CASCADE;

-- Step 2: Add location field to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;

-- Step 3: Add AI generation tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMPTZ;

-- Step 4: Add budget fields directly to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_budget NUMERIC(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS spent_budget NUMERIC(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Step 5: Add AI tracking to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(15,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_email TEXT;

-- Step 6: Create task access tokens for magic links (no-login task updates)
CREATE TABLE IF NOT EXISTS task_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_access_tokens_token ON task_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_task_access_tokens_task ON task_access_tokens(task_id);
CREATE INDEX IF NOT EXISTS idx_task_access_tokens_email ON task_access_tokens(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_access_tokens_task_email ON task_access_tokens(task_id, email);

-- Step 7: Create task comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);

-- Step 8: Create project budget items table (AI-generated budget breakdown)
CREATE TABLE IF NOT EXISTS project_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  estimated_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(15,2) DEFAULT 0,
  ai_generated BOOLEAN DEFAULT false,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_budget_items_project ON project_budget_items(project_id);

-- Step 9: RLS policies for new tables
ALTER TABLE task_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_access_tokens FORCE ROW LEVEL SECURITY;
CREATE POLICY task_access_tokens_tenant_isolation ON task_access_tokens
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments FORCE ROW LEVEL SECURITY;
CREATE POLICY task_comments_tenant_isolation ON task_comments
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE project_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budget_items FORCE ROW LEVEL SECURITY;
CREATE POLICY project_budget_items_tenant_isolation ON project_budget_items
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());
