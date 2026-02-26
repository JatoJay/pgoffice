SELECT set_config('app.is_super_admin', 'true', true);

INSERT INTO modules (key, name, description, category, is_core)
VALUES
  ('experience_builder', 'Experience Builder', 'Program and journey configuration', 'core', true),
  ('projects_tasks', 'Projects & Tasks', 'Projects, milestones, tasks, dependencies', 'execution', true),
  ('events', 'Events', 'Event series management', 'execution', true),
  ('budgeting', 'Budgeting', 'Budget planning and spend tracking', 'execution', true),
  ('audience_network', 'Audience & Network', 'Profiles, relationships, and segmentation', 'network', true),
  ('connections', 'Connection Engine', 'Matchmaking and connection outcomes', 'network', true),
  ('pipeline', 'Pipeline', 'Opportunity and commitment tracking', 'impact', true),
  ('surveys', 'Surveys & Feedback', 'Survey builder and feedback analysis', 'impact', true),
  ('kpis_metrics', 'KPIs & Metrics', 'KPI definitions and impact dashboards', 'impact', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_templates (key, name, description, permissions)
VALUES
  ('super_admin', 'Super Admin', 'Platform owner with full access', '{"scope":"platform","all":true}'),
  ('org_admin', 'Organization Admin', 'Manages instance settings and users', '{"scope":"instance","manage_users":true,"manage_programs":true,"manage_billing":true}'),
  ('program_manager', 'Program Manager', 'Manages programs and modules', '{"scope":"instance","manage_programs":true,"manage_events":true,"manage_tasks":true}'),
  ('contributor', 'Contributor', 'Executes tasks and updates data', '{"scope":"instance","manage_tasks":true,"manage_events":true}'),
  ('participant', 'Participant', 'Participates in programs', '{"scope":"instance","view_self":true}'),
  ('volunteer', 'Volunteer', 'Volunteers for program activities', '{"scope":"instance","view_self":true,"manage_tasks":true}'),
  ('advisor', 'Advisor / Elder', 'Limited advisory access', '{"scope":"instance","view_programs":true}'),
  ('partner', 'Partner / Investor', 'Read-only dashboards', '{"scope":"instance","view_dashboards":true}')
ON CONFLICT (key) DO NOTHING;
