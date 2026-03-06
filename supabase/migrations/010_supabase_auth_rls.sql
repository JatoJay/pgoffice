-- Migration: Update RLS policies to use Supabase Auth instead of app.current_tenant_id()
-- This migration adds new policies that work with auth.uid() for Supabase Auth

-- Create a function to get user's tenant_id from their metadata or memberships
CREATE OR REPLACE FUNCTION public.get_user_tenant_id() RETURNS uuid AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::uuid,
    (SELECT tenant_id FROM memberships WHERE user_id = (
      SELECT id FROM users WHERE external_id = auth.uid()::text LIMIT 1
    ) LIMIT 1)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Create a function to check if user has access to a tenant
CREATE OR REPLACE FUNCTION public.user_has_tenant_access(check_tenant_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships m
    JOIN users u ON u.id = m.user_id
    WHERE u.external_id = auth.uid()::text
    AND m.tenant_id = check_tenant_id
  ) OR (auth.jwt() ->> 'tenant_id')::uuid = check_tenant_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Drop old policies and create new ones for key tables

-- Organizations: Allow access if user belongs to an instance of this org
DROP POLICY IF EXISTS organizations_tenant_isolation ON organizations;
CREATE POLICY organizations_supabase_auth ON organizations
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      id IN (
        SELECT i.organization_id FROM instances i
        JOIN memberships m ON m.tenant_id = i.id
        JOIN users u ON u.id = m.user_id
        WHERE u.external_id = auth.uid()::text
      )
    )
  );

-- Instances: Allow access to instances user is a member of
DROP POLICY IF EXISTS instances_tenant_isolation ON instances;
CREATE POLICY instances_supabase_auth ON instances
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      id IN (
        SELECT m.tenant_id FROM memberships m
        JOIN users u ON u.id = m.user_id
        WHERE u.external_id = auth.uid()::text
      )
    )
  );

-- Instance Branding
DROP POLICY IF EXISTS instance_branding_tenant_isolation ON instance_branding;
CREATE POLICY instance_branding_supabase_auth ON instance_branding
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Users: Allow access to users in same tenant
DROP POLICY IF EXISTS users_tenant_isolation ON users;
CREATE POLICY users_supabase_auth ON users
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      id IN (
        SELECT m1.user_id FROM memberships m1
        WHERE m1.tenant_id IN (
          SELECT m2.tenant_id FROM memberships m2
          JOIN users u ON u.id = m2.user_id
          WHERE u.external_id = auth.uid()::text
        )
      )
      OR external_id = auth.uid()::text
    )
  );

-- Roles
DROP POLICY IF EXISTS roles_tenant_isolation ON roles;
CREATE POLICY roles_supabase_auth ON roles
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Memberships
DROP POLICY IF EXISTS memberships_tenant_isolation ON memberships;
CREATE POLICY memberships_supabase_auth ON memberships
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Programs
DROP POLICY IF EXISTS programs_tenant_isolation ON programs;
CREATE POLICY programs_supabase_auth ON programs
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Projects
DROP POLICY IF EXISTS projects_tenant_isolation ON projects;
CREATE POLICY projects_supabase_auth ON projects
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Tasks
DROP POLICY IF EXISTS tasks_tenant_isolation ON tasks;
CREATE POLICY tasks_supabase_auth ON tasks
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Task Access Tokens (also allow access by valid token)
DROP POLICY IF EXISTS task_access_tokens_tenant_isolation ON task_access_tokens;
CREATE POLICY task_access_tokens_supabase_auth ON task_access_tokens
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Task Comments
DROP POLICY IF EXISTS task_comments_tenant_isolation ON task_comments;
CREATE POLICY task_comments_supabase_auth ON task_comments
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Project Budget Items
DROP POLICY IF EXISTS project_budget_items_tenant_isolation ON project_budget_items;
CREATE POLICY project_budget_items_supabase_auth ON project_budget_items
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Documents (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    EXECUTE 'DROP POLICY IF EXISTS documents_tenant_isolation ON documents';
    EXECUTE 'CREATE POLICY documents_supabase_auth ON documents FOR ALL USING (public.user_has_tenant_access(tenant_id))';
  END IF;
END $$;

-- Document Versions (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_versions') THEN
    EXECUTE 'DROP POLICY IF EXISTS document_versions_tenant_isolation ON document_versions';
    EXECUTE 'CREATE POLICY document_versions_supabase_auth ON document_versions FOR ALL USING (public.user_has_tenant_access(tenant_id))';
  END IF;
END $$;

-- Milestones
DROP POLICY IF EXISTS milestones_tenant_isolation ON milestones;
CREATE POLICY milestones_supabase_auth ON milestones
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Events
DROP POLICY IF EXISTS events_tenant_isolation ON events;
CREATE POLICY events_supabase_auth ON events
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Budgets
DROP POLICY IF EXISTS budgets_tenant_isolation ON budgets;
CREATE POLICY budgets_supabase_auth ON budgets
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Files
DROP POLICY IF EXISTS files_tenant_isolation ON files;
CREATE POLICY files_supabase_auth ON files
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Profiles
DROP POLICY IF EXISTS profiles_tenant_isolation ON profiles;
CREATE POLICY profiles_supabase_auth ON profiles
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Surveys
DROP POLICY IF EXISTS surveys_tenant_isolation ON surveys;
CREATE POLICY surveys_supabase_auth ON surveys
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- KPIs
DROP POLICY IF EXISTS kpis_tenant_isolation ON kpis;
CREATE POLICY kpis_supabase_auth ON kpis
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Dashboards
DROP POLICY IF EXISTS dashboards_tenant_isolation ON dashboards;
CREATE POLICY dashboards_supabase_auth ON dashboards
  FOR ALL USING (public.user_has_tenant_access(tenant_id));

-- Create trigger to auto-create user record on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (external_id, email, name)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (external_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint on external_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_external_id_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_external_id_key UNIQUE (external_id);
  END IF;
END $$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
