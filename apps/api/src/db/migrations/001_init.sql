CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'instance_status') THEN
    CREATE TYPE instance_status AS ENUM ('active', 'suspended', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'program_status') THEN
    CREATE TYPE program_status AS ENUM ('draft', 'active', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE event_status AS ENUM ('draft', 'scheduled', 'completed', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'survey_status') THEN
    CREATE TYPE survey_status AS ENUM ('draft', 'active', 'closed');
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app.is_super_admin() RETURNS boolean AS $$
  SELECT COALESCE(NULLIF(current_setting('app.is_super_admin', true), ''), 'false') = 'true';
$$ LANGUAGE sql STABLE;

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  status instance_status NOT NULL DEFAULT 'active',
  subscription_tier TEXT,
  seat_limit INT,
  user_limit INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instance_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id)
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, role_id)
);

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status program_status NOT NULL DEFAULT 'draft',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_core BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL REFERENCES modules(key) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_id, module_key)
);

CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS segment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  rule JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority INT NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, depends_on_task_id)
);

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  storage_key TEXT NOT NULL,
  bucket TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status event_status NOT NULL DEFAULT 'draft',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  location TEXT,
  virtual_url TEXT,
  capacity INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  event_session_id UUID NOT NULL REFERENCES event_sessions(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_session_id, profile_id)
);

CREATE TABLE IF NOT EXISTS event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  score INT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  total_amount NUMERIC(14, 2),
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cost_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  cost_category_id UUID REFERENCES cost_categories(id) ON DELETE SET NULL,
  funding_source_id UUID REFERENCES funding_sources(id) ON DELETE SET NULL,
  description TEXT,
  planned_amount NUMERIC(14, 2),
  actual_amount NUMERIC(14, 2),
  spent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  organization TEXT,
  title TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  source_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS taggings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tag_id, profile_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  source_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'proposed',
  score NUMERIC(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount NUMERIC(14, 2),
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opportunity_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  note TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status survey_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT NOT NULL,
  options JSONB,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_number NUMERIC(14, 4),
  answer_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  formula TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  name TEXT,
  source_type TEXT NOT NULL,
  source_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metric_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  subject_type TEXT,
  subject_id UUID,
  value NUMERIC(18, 6) NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instances_org ON instances(organization_id);

CREATE INDEX IF NOT EXISTS idx_instance_branding_tenant ON instance_branding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_tenant ON programs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_program_phases_program ON program_phases(program_id);
CREATE INDEX IF NOT EXISTS idx_program_modules_program ON program_modules(program_id);
CREATE INDEX IF NOT EXISTS idx_segments_program ON segments(program_id);
CREATE INDEX IF NOT EXISTS idx_projects_program ON projects(program_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_events_program ON events(program_id);
CREATE INDEX IF NOT EXISTS idx_budgets_program ON budgets(program_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_profile_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_program ON pipelines(program_id);
CREATE INDEX IF NOT EXISTS idx_surveys_program ON surveys(program_id);
CREATE INDEX IF NOT EXISTS idx_kpis_tenant ON kpis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metric_values_metric ON metric_values(metric_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_tenant ON dashboards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
CREATE POLICY organizations_tenant_isolation ON organizations
  USING (
    app.is_super_admin()
    OR id IN (
      SELECT organization_id FROM instances
      WHERE id = app.current_tenant_id()
    )
  )
  WITH CHECK (
    app.is_super_admin()
    OR id IN (
      SELECT organization_id FROM instances
      WHERE id = app.current_tenant_id()
    )
  );

ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances FORCE ROW LEVEL SECURITY;
CREATE POLICY instances_tenant_isolation ON instances
  USING (app.is_super_admin() OR id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR id = app.current_tenant_id());

ALTER TABLE instance_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE instance_branding FORCE ROW LEVEL SECURITY;
CREATE POLICY instance_branding_tenant_isolation ON instance_branding
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_tenant_isolation ON users
  USING (
    app.is_super_admin()
    OR id IN (
      SELECT user_id FROM memberships
      WHERE tenant_id = app.current_tenant_id()
    )
  )
  WITH CHECK (true);

ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_templates FORCE ROW LEVEL SECURITY;
CREATE POLICY role_templates_read ON role_templates
  USING (true)
  WITH CHECK (app.is_super_admin());

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;
CREATE POLICY roles_tenant_isolation ON roles
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY memberships_tenant_isolation ON memberships
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules FORCE ROW LEVEL SECURITY;
CREATE POLICY modules_read ON modules
  USING (true)
  WITH CHECK (app.is_super_admin());

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs FORCE ROW LEVEL SECURITY;
CREATE POLICY programs_tenant_isolation ON programs
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE program_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_phases FORCE ROW LEVEL SECURITY;
CREATE POLICY program_phases_tenant_isolation ON program_phases
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE program_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_modules FORCE ROW LEVEL SECURITY;
CREATE POLICY program_modules_tenant_isolation ON program_modules
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments FORCE ROW LEVEL SECURITY;
CREATE POLICY segments_tenant_isolation ON segments
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE segment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_rules FORCE ROW LEVEL SECURITY;
CREATE POLICY segment_rules_tenant_isolation ON segment_rules
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
CREATE POLICY projects_tenant_isolation ON projects
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones FORCE ROW LEVEL SECURITY;
CREATE POLICY milestones_tenant_isolation ON milestones
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
CREATE POLICY tasks_tenant_isolation ON tasks
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY task_assignments_tenant_isolation ON task_assignments
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies FORCE ROW LEVEL SECURITY;
CREATE POLICY task_dependencies_tenant_isolation ON task_dependencies
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE files FORCE ROW LEVEL SECURITY;
CREATE POLICY files_tenant_isolation ON files
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events FORCE ROW LEVEL SECURITY;
CREATE POLICY events_tenant_isolation ON events
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY event_sessions_tenant_isolation ON event_sessions
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations FORCE ROW LEVEL SECURITY;
CREATE POLICY event_registrations_tenant_isolation ON event_registrations
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance FORCE ROW LEVEL SECURITY;
CREATE POLICY event_attendance_tenant_isolation ON event_attendance
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_feedback FORCE ROW LEVEL SECURITY;
CREATE POLICY event_feedback_tenant_isolation ON event_feedback
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets FORCE ROW LEVEL SECURITY;
CREATE POLICY budgets_tenant_isolation ON budgets
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_categories FORCE ROW LEVEL SECURITY;
CREATE POLICY cost_categories_tenant_isolation ON cost_categories
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_sources FORCE ROW LEVEL SECURITY;
CREATE POLICY funding_sources_tenant_isolation ON funding_sources
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items FORCE ROW LEVEL SECURITY;
CREATE POLICY budget_items_tenant_isolation ON budget_items
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY profiles_tenant_isolation ON profiles
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships FORCE ROW LEVEL SECURITY;
CREATE POLICY relationships_tenant_isolation ON relationships
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions FORCE ROW LEVEL SECURITY;
CREATE POLICY interactions_tenant_isolation ON interactions
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags FORCE ROW LEVEL SECURITY;
CREATE POLICY tags_tenant_isolation ON tags
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE taggings ENABLE ROW LEVEL SECURITY;
ALTER TABLE taggings FORCE ROW LEVEL SECURITY;
CREATE POLICY taggings_tenant_isolation ON taggings
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches FORCE ROW LEVEL SECURITY;
CREATE POLICY matches_tenant_isolation ON matches
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines FORCE ROW LEVEL SECURITY;
CREATE POLICY pipelines_tenant_isolation ON pipelines
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages FORCE ROW LEVEL SECURITY;
CREATE POLICY pipeline_stages_tenant_isolation ON pipeline_stages
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities FORCE ROW LEVEL SECURITY;
CREATE POLICY opportunities_tenant_isolation ON opportunities
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE opportunity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_history FORCE ROW LEVEL SECURITY;
CREATE POLICY opportunity_history_tenant_isolation ON opportunity_history
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys FORCE ROW LEVEL SECURITY;
CREATE POLICY surveys_tenant_isolation ON surveys
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions FORCE ROW LEVEL SECURITY;
CREATE POLICY survey_questions_tenant_isolation ON survey_questions
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses FORCE ROW LEVEL SECURITY;
CREATE POLICY survey_responses_tenant_isolation ON survey_responses
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE survey_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answers FORCE ROW LEVEL SECURITY;
CREATE POLICY survey_answers_tenant_isolation ON survey_answers
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis FORCE ROW LEVEL SECURITY;
CREATE POLICY kpis_tenant_isolation ON kpis
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics FORCE ROW LEVEL SECURITY;
CREATE POLICY metrics_tenant_isolation ON metrics
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE metric_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_values FORCE ROW LEVEL SECURITY;
CREATE POLICY metric_values_tenant_isolation ON metric_values
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards FORCE ROW LEVEL SECURITY;
CREATE POLICY dashboards_tenant_isolation ON dashboards
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys FORCE ROW LEVEL SECURITY;
CREATE POLICY api_keys_tenant_isolation ON api_keys
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  USING (app.is_super_admin() OR tenant_id = app.current_tenant_id())
  WITH CHECK (app.is_super_admin() OR tenant_id = app.current_tenant_id());
