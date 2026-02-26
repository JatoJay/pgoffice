import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";

export type PhaseTaskRow = {
  id: string;
  tenant_id: string;
  phase_id: string;
  parent_task_id: string | null;
  name: string;
  description: string | null;
  status: string;
  assignee_id: string | null;
  start_at: string | null;
  due_at: string | null;
  completed_at: string | null;
  order_index: number;
  reminder_enabled: boolean;
  reminder_days_before: number | null;
  reminder_sent_at: string | null;
  allocated_budget: string;
  spent_budget: string;
  created_at: string;
  updated_at: string;
};

export type TaskReminderRow = {
  id: string;
  task_id: string;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
  created_at: string;
};

type PhaseRow = {
  id: string;
  tenant_id: string;
  program_id: string;
};

const TASK_COLUMNS = "id, tenant_id, phase_id, parent_task_id, name, description, status, assignee_id, start_at, due_at, completed_at, order_index, reminder_enabled, reminder_days_before, reminder_sent_at, allocated_budget, spent_budget, created_at, updated_at";

@Injectable()
export class PhaseTasksService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService
  ) {}

  private async getPhase(phaseId: string): Promise<PhaseRow | null> {
    const { rows } = await this.db.query<PhaseRow>(
      "SELECT id, tenant_id, program_id FROM program_phases WHERE id = $1",
      [phaseId]
    );
    return rows[0] ?? null;
  }

  private async getTask(taskId: string): Promise<PhaseTaskRow | null> {
    const { rows } = await this.db.query<PhaseTaskRow>(
      `SELECT ${TASK_COLUMNS} FROM phase_tasks WHERE id = $1`,
      [taskId]
    );
    return rows[0] ?? null;
  }

  async list(phaseId: string) {
    const { rows } = await this.db.query<PhaseTaskRow>(
      `SELECT ${TASK_COLUMNS} FROM phase_tasks WHERE phase_id = $1 AND parent_task_id IS NULL ORDER BY order_index ASC, created_at ASC`,
      [phaseId]
    );
    return rows;
  }

  async get(taskId: string) {
    return this.getTask(taskId);
  }

  async create(phaseId: string, input: {
    name: string;
    description?: string | null;
    status?: string | null;
    assignee_id?: string | null;
    start_at?: string | null;
    due_at?: string | null;
    order_index?: number | null;
    reminder_enabled?: boolean | null;
    reminder_days_before?: number | null;
    allocated_budget?: number | null;
  }) {
    const phase = await this.getPhase(phaseId);
    if (!phase) {
      throw new BadRequestException("Phase not found");
    }
    const { rows } = await this.db.query<PhaseTaskRow>(
      `INSERT INTO phase_tasks (tenant_id, phase_id, name, description, status, assignee_id, start_at, due_at, order_index, reminder_enabled, reminder_days_before, allocated_budget)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'pending'), $6, $7, $8, COALESCE($9, 0), COALESCE($10, false), $11, COALESCE($12, 0))
       RETURNING ${TASK_COLUMNS}`,
      [phase.tenant_id, phaseId, input.name, input.description ?? null, input.status ?? null, input.assignee_id ?? null, input.start_at ?? null, input.due_at ?? null, input.order_index ?? null, input.reminder_enabled ?? null, input.reminder_days_before ?? null, input.allocated_budget ?? null]
    );
    const task = rows[0];
    if (task.reminder_enabled && task.due_at) {
      await this.scheduleReminder(task);
    }
    return { task, programId: phase.program_id };
  }

  async update(taskId: string, input: {
    name?: string | null;
    description?: string | null;
    status?: string | null;
    assignee_id?: string | null;
    start_at?: string | null;
    due_at?: string | null;
    order_index?: number | null;
    reminder_enabled?: boolean | null;
    reminder_days_before?: number | null;
    allocated_budget?: number | null;
    spent_budget?: number | null;
  }) {
    const { rows } = await this.db.query<PhaseTaskRow>(
      `UPDATE phase_tasks SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        status = COALESCE($4, status),
        assignee_id = COALESCE($5, assignee_id),
        start_at = COALESCE($6, start_at),
        due_at = COALESCE($7, due_at),
        order_index = COALESCE($8, order_index),
        reminder_enabled = COALESCE($9, reminder_enabled),
        reminder_days_before = COALESCE($10, reminder_days_before),
        allocated_budget = COALESCE($11, allocated_budget),
        spent_budget = COALESCE($12, spent_budget),
        completed_at = CASE WHEN $4 = 'completed' THEN now() ELSE completed_at END,
        updated_at = now()
      WHERE id = $1
      RETURNING ${TASK_COLUMNS}`,
      [taskId, input.name ?? null, input.description ?? null, input.status ?? null, input.assignee_id ?? null, input.start_at ?? null, input.due_at ?? null, input.order_index ?? null, input.reminder_enabled ?? null, input.reminder_days_before ?? null, input.allocated_budget ?? null, input.spent_budget ?? null]
    );
    const task = rows[0];
    if (task && (input.reminder_enabled !== undefined || input.due_at !== undefined || input.reminder_days_before !== undefined)) {
      await this.db.query("DELETE FROM task_reminders WHERE task_id = $1 AND status = 'pending'", [taskId]);
      if (task.reminder_enabled && task.due_at) {
        await this.scheduleReminder(task);
      }
    }

    let programId: string | null = null;
    if (task && (input.spent_budget !== undefined || input.allocated_budget !== undefined)) {
      const phase = await this.getPhase(task.phase_id);
      programId = phase?.program_id ?? null;
    }

    return { task: task ?? null, programId };
  }

  async delete(taskId: string) {
    const { rowCount } = await this.db.query(
      "DELETE FROM phase_tasks WHERE id = $1",
      [taskId]
    );
    return (rowCount ?? 0) > 0;
  }

  async listSubtasks(taskId: string) {
    const { rows } = await this.db.query<PhaseTaskRow>(
      `SELECT ${TASK_COLUMNS} FROM phase_tasks WHERE parent_task_id = $1 ORDER BY order_index ASC, created_at ASC`,
      [taskId]
    );
    return rows;
  }

  async createSubtask(taskId: string, input: {
    name: string;
    description?: string | null;
    status?: string | null;
    assignee_id?: string | null;
    start_at?: string | null;
    due_at?: string | null;
    order_index?: number | null;
    reminder_enabled?: boolean | null;
    reminder_days_before?: number | null;
  }) {
    const parentTask = await this.getTask(taskId);
    if (!parentTask) {
      throw new BadRequestException("Parent task not found");
    }
    const { rows } = await this.db.query<PhaseTaskRow>(
      `INSERT INTO phase_tasks (tenant_id, phase_id, parent_task_id, name, description, status, assignee_id, start_at, due_at, order_index, reminder_enabled, reminder_days_before)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'pending'), $7, $8, $9, COALESCE($10, 0), COALESCE($11, false), $12)
       RETURNING ${TASK_COLUMNS}`,
      [parentTask.tenant_id, parentTask.phase_id, taskId, input.name, input.description ?? null, input.status ?? null, input.assignee_id ?? null, input.start_at ?? null, input.due_at ?? null, input.order_index ?? null, input.reminder_enabled ?? null, input.reminder_days_before ?? null]
    );
    const task = rows[0];
    if (task.reminder_enabled && task.due_at) {
      await this.scheduleReminder(task);
    }
    return task;
  }

  private async scheduleReminder(task: PhaseTaskRow) {
    if (!task.due_at) return;
    const dueDate = new Date(task.due_at);
    const daysBefore = task.reminder_days_before ?? 1;
    const scheduledAt = new Date(dueDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
    if (scheduledAt > new Date()) {
      await this.db.query(
        "INSERT INTO task_reminders (task_id, scheduled_at) VALUES ($1, $2)",
        [task.id, scheduledAt.toISOString()]
      );
    }
  }

  async listReminders(taskId: string) {
    const { rows } = await this.db.query<TaskReminderRow>(
      "SELECT id, task_id, scheduled_at, sent_at, status, created_at FROM task_reminders WHERE task_id = $1 ORDER BY scheduled_at ASC",
      [taskId]
    );
    return rows;
  }

  async getPendingReminders() {
    const { rows } = await this.db.query<TaskReminderRow & { assignee_email: string | null; task_name: string }>(
      `SELECT tr.id, tr.task_id, tr.scheduled_at, tr.sent_at, tr.status, tr.created_at, pt.name as task_name, u.email as assignee_email
       FROM task_reminders tr
       JOIN phase_tasks pt ON pt.id = tr.task_id
       LEFT JOIN users u ON u.id = pt.assignee_id
       WHERE tr.status = 'pending' AND tr.scheduled_at <= now()
       ORDER BY tr.scheduled_at ASC`
    );
    return rows;
  }

  async markReminderSent(reminderId: string) {
    await this.db.query(
      "UPDATE task_reminders SET status = 'sent', sent_at = now() WHERE id = $1",
      [reminderId]
    );
  }
}
