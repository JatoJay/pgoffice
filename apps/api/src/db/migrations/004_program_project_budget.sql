-- Reverse relationship: Programs belong to Projects (not the other way around)
-- Flow: Instance -> Project -> Program -> Tasks -> Budget

-- Step 1: Add project_id to programs (nullable initially for migration)
ALTER TABLE programs ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Step 2: Add budget fields to programs
ALTER TABLE programs ADD COLUMN IF NOT EXISTS total_budget NUMERIC(15,2) DEFAULT 0;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS spent_budget NUMERIC(15,2) DEFAULT 0;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Step 3: Add budget fields to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS allocated_budget NUMERIC(15,2) DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS spent_budget NUMERIC(15,2) DEFAULT 0;

-- Step 4: Create budget notifications table
CREATE TABLE IF NOT EXISTS budget_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'warning_75', 'warning_90', 'exhausted'
  threshold_percent INT NOT NULL,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 5: Create index for budget notifications
CREATE INDEX IF NOT EXISTS idx_budget_notifications_program ON budget_notifications(program_id);
CREATE INDEX IF NOT EXISTS idx_budget_notifications_task_id ON budget_notifications(task_id);

-- Step 6: Remove program_id from projects (after data migration if needed)
-- Note: We keep program_id for backward compatibility but it's now optional
ALTER TABLE projects ALTER COLUMN program_id DROP NOT NULL;
