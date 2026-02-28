import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";
import { GeminiService, ProjectGenerationInput } from "../ai/gemini.service.js";
import { EmailService } from "../email/email.service.js";

export type ProjectRow = {
  id: string;
  tenant_id: string;
  instance_id: string | null;
  program_id: string | null;
  name: string;
  description: string | null;
  location: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  total_budget: number;
  spent_budget: number;
  currency: string;
  ai_generated: boolean;
  ai_generated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: string;
  priority: number;
  due_at: string | null;
  estimated_cost: number | null;
  order_index: number;
  assignee_email: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
};

export type BudgetItemRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  category: string;
  description: string | null;
  estimated_amount: number;
  actual_amount: number;
  ai_generated: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type TaskAccessTokenRow = {
  id: string;
  tenant_id: string;
  task_id: string;
  email: string;
  token: string;
  expires_at: string;
  last_used_at: string | null;
  created_at: string;
};

export type TaskCommentRow = {
  id: string;
  tenant_id: string;
  task_id: string;
  author_email: string;
  author_name: string | null;
  content: string;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class ProjectGeneratorService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(RequestContextService) private readonly context: RequestContextService,
    @Inject(GeminiService) private readonly gemini: GeminiService,
    @Inject(EmailService) private readonly email: EmailService
  ) {}

  private resolveTenantId(inputTenantId?: string | null) {
    const ctx = this.context.get();
    if (inputTenantId && ctx?.tenantId && inputTenantId !== ctx.tenantId) {
      throw new BadRequestException("tenant_id mismatch");
    }
    const tenantId = inputTenantId ?? ctx?.tenantId;
    if (!tenantId) {
      throw new BadRequestException("Missing tenant context");
    }
    return tenantId;
  }

  async generateProject(input: {
    instance_id: string;
    name: string;
    description: string;
    start_at: string;
    end_at: string;
    location: string;
  }): Promise<{ project: ProjectRow; tasks: TaskRow[]; budget_items: BudgetItemRow[] }> {
    const tenantId = this.resolveTenantId(input.instance_id);

    const aiInput: ProjectGenerationInput = {
      name: input.name,
      description: input.description,
      timeline: {
        start_date: input.start_at,
        end_date: input.end_at
      },
      location: input.location
    };

    const generated = await this.gemini.generateProjectPlan(aiInput);

    const { rows: projectRows } = await this.db.query<ProjectRow>(
      `INSERT INTO projects (tenant_id, instance_id, name, description, location, status, start_at, end_at, total_budget, currency, ai_generated, ai_generated_at)
       VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7, $8, $9, true, now())
       RETURNING *`,
      [
        tenantId,
        input.instance_id,
        input.name,
        input.description,
        input.location,
        input.start_at,
        input.end_at,
        generated.total_budget,
        generated.currency
      ]
    );
    const project = projectRows[0];

    const tasks: TaskRow[] = [];
    for (const task of generated.tasks) {
      const dueDate = this.calculateDueDate(input.start_at, input.end_at, task.order_index, generated.tasks.length);
      const { rows: taskRows } = await this.db.query<TaskRow>(
        `INSERT INTO tasks (tenant_id, project_id, name, description, status, priority, due_at, estimated_cost, order_index, ai_generated)
         VALUES ($1, $2, $3, $4, 'todo', $5, $6, $7, $8, true)
         RETURNING *`,
        [
          tenantId,
          project.id,
          task.name,
          task.description,
          task.priority,
          dueDate,
          task.estimated_cost,
          task.order_index
        ]
      );
      tasks.push(taskRows[0]);
    }

    const budgetItems: BudgetItemRow[] = [];
    for (const item of generated.budget_items) {
      const { rows: itemRows } = await this.db.query<BudgetItemRow>(
        `INSERT INTO project_budget_items (tenant_id, project_id, category, description, estimated_amount, ai_generated, order_index)
         VALUES ($1, $2, $3, $4, $5, true, $6)
         RETURNING *`,
        [
          tenantId,
          project.id,
          item.category,
          item.description,
          item.estimated_amount,
          item.order_index
        ]
      );
      budgetItems.push(itemRows[0]);
    }

    return { project, tasks, budget_items: budgetItems };
  }

  private calculateDueDate(startAt: string, endAt: string, orderIndex: number, totalTasks: number): string {
    const start = new Date(startAt);
    const end = new Date(endAt);
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysPerTask = totalDays / totalTasks;
    const taskDueDate = new Date(start.getTime() + daysPerTask * (orderIndex + 1) * 24 * 60 * 60 * 1000);
    return taskDueDate.toISOString();
  }

  async assignTask(taskId: string, email: string): Promise<{ task: TaskRow; accessToken: string; accessLink: string }> {
    const tenantId = this.resolveTenantId();

    const { rows: taskRows } = await this.db.query<TaskRow>(
      `UPDATE tasks SET assignee_email = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [taskId, email]
    );
    if (!taskRows[0]) {
      throw new BadRequestException("Task not found");
    }
    const task = taskRows[0];

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.db.query(
      `INSERT INTO task_access_tokens (tenant_id, task_id, email, token, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (task_id, email) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`,
      [tenantId, taskId, email, token, expiresAt.toISOString()]
    );

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const accessLink = `${appUrl}/tasks/public/${token}`;

    const { rows: projectRows } = await this.db.query<{ name: string }>(
      `SELECT name FROM projects WHERE id = $1`,
      [task.project_id]
    );

    await this.email.sendTaskAssignment({
      to: email,
      taskName: task.name,
      projectName: projectRows[0]?.name || "Project",
      description: task.description || "",
      dueDate: task.due_at,
      accessLink
    });

    return { task, accessToken: token, accessLink };
  }

  async getTaskByToken(token: string): Promise<{ task: TaskRow; comments: TaskCommentRow[] } | null> {
    const { rows: tokenRows } = await this.db.query<TaskAccessTokenRow>(
      `SELECT * FROM task_access_tokens WHERE token = $1 AND expires_at > now()`,
      [token],
      { isSuperAdmin: true }
    );

    if (!tokenRows[0]) {
      return null;
    }

    const accessToken = tokenRows[0];

    await this.db.query(
      `UPDATE task_access_tokens SET last_used_at = now() WHERE id = $1`,
      [accessToken.id],
      { isSuperAdmin: true }
    );

    const { rows: taskRows } = await this.db.query<TaskRow>(
      `SELECT * FROM tasks WHERE id = $1`,
      [accessToken.task_id],
      { isSuperAdmin: true }
    );

    if (!taskRows[0]) {
      return null;
    }

    const { rows: comments } = await this.db.query<TaskCommentRow>(
      `SELECT * FROM task_comments WHERE task_id = $1 ORDER BY created_at ASC`,
      [accessToken.task_id],
      { isSuperAdmin: true }
    );

    return { task: taskRows[0], comments };
  }

  async updateTaskByToken(token: string, input: { status?: string; comment?: string }): Promise<TaskRow | null> {
    const { rows: tokenRows } = await this.db.query<TaskAccessTokenRow>(
      `SELECT * FROM task_access_tokens WHERE token = $1 AND expires_at > now()`,
      [token],
      { isSuperAdmin: true }
    );

    if (!tokenRows[0]) {
      return null;
    }

    const accessToken = tokenRows[0];

    if (input.status) {
      await this.db.query(
        `UPDATE tasks SET status = $2, updated_at = now() WHERE id = $1`,
        [accessToken.task_id, input.status],
        { isSuperAdmin: true }
      );
    }

    if (input.comment) {
      await this.db.query(
        `INSERT INTO task_comments (tenant_id, task_id, author_email, content)
         VALUES ($1, $2, $3, $4)`,
        [accessToken.tenant_id, accessToken.task_id, accessToken.email, input.comment],
        { isSuperAdmin: true }
      );
    }

    const { rows: taskRows } = await this.db.query<TaskRow>(
      `SELECT * FROM tasks WHERE id = $1`,
      [accessToken.task_id],
      { isSuperAdmin: true }
    );

    return taskRows[0] ?? null;
  }

  async listProjectTasks(projectId: string): Promise<TaskRow[]> {
    const { rows } = await this.db.query<TaskRow>(
      `SELECT * FROM tasks WHERE project_id = $1 ORDER BY order_index ASC, created_at ASC`,
      [projectId]
    );
    return rows;
  }

  async listProjectBudgetItems(projectId: string): Promise<BudgetItemRow[]> {
    const { rows } = await this.db.query<BudgetItemRow>(
      `SELECT * FROM project_budget_items WHERE project_id = $1 ORDER BY order_index ASC`,
      [projectId]
    );
    return rows;
  }

  async updateTask(taskId: string, input: {
    name?: string;
    description?: string;
    status?: string;
    priority?: number;
    due_at?: string | null;
    estimated_cost?: number | null;
    order_index?: number;
  }): Promise<TaskRow | null> {
    const { rows } = await this.db.query<TaskRow>(
      `UPDATE tasks SET
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         status = COALESCE($4, status),
         priority = COALESCE($5, priority),
         due_at = COALESCE($6, due_at),
         estimated_cost = COALESCE($7, estimated_cost),
         order_index = COALESCE($8, order_index),
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [taskId, input.name, input.description, input.status, input.priority, input.due_at, input.estimated_cost, input.order_index]
    );
    return rows[0] ?? null;
  }

  async updateBudgetItem(itemId: string, input: {
    category?: string;
    description?: string;
    estimated_amount?: number;
    actual_amount?: number;
  }): Promise<BudgetItemRow | null> {
    const { rows } = await this.db.query<BudgetItemRow>(
      `UPDATE project_budget_items SET
         category = COALESCE($2, category),
         description = COALESCE($3, description),
         estimated_amount = COALESCE($4, estimated_amount),
         actual_amount = COALESCE($5, actual_amount),
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [itemId, input.category, input.description, input.estimated_amount, input.actual_amount]
    );
    return rows[0] ?? null;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const { rowCount } = await this.db.query(
      `DELETE FROM tasks WHERE id = $1`,
      [taskId]
    );
    return (rowCount ?? 0) > 0;
  }

  async deleteBudgetItem(itemId: string): Promise<boolean> {
    const { rowCount } = await this.db.query(
      `DELETE FROM project_budget_items WHERE id = $1`,
      [itemId]
    );
    return (rowCount ?? 0) > 0;
  }

  async addTask(projectId: string, input: {
    name: string;
    description?: string;
    priority?: number;
    due_at?: string;
    estimated_cost?: number;
    order_index?: number;
  }): Promise<TaskRow> {
    const tenantId = this.resolveTenantId();
    const { rows } = await this.db.query<TaskRow>(
      `INSERT INTO tasks (tenant_id, project_id, name, description, status, priority, due_at, estimated_cost, order_index, ai_generated)
       VALUES ($1, $2, $3, $4, 'todo', $5, $6, $7, $8, false)
       RETURNING *`,
      [tenantId, projectId, input.name, input.description ?? null, input.priority ?? 0, input.due_at ?? null, input.estimated_cost ?? null, input.order_index ?? 0]
    );
    return rows[0];
  }

  async addBudgetItem(projectId: string, input: {
    category: string;
    description?: string;
    estimated_amount: number;
  }): Promise<BudgetItemRow> {
    const tenantId = this.resolveTenantId();
    const { rows } = await this.db.query<BudgetItemRow>(
      `INSERT INTO project_budget_items (tenant_id, project_id, category, description, estimated_amount, ai_generated)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [tenantId, projectId, input.category, input.description ?? null, input.estimated_amount]
    );
    return rows[0];
  }

  async listInstanceProjects(instanceId: string): Promise<ProjectRow[]> {
    const { rows } = await this.db.query<ProjectRow>(
      `SELECT * FROM projects WHERE instance_id = $1 ORDER BY created_at DESC`,
      [instanceId]
    );
    return rows;
  }

  async getProject(projectId: string): Promise<ProjectRow | null> {
    const { rows } = await this.db.query<ProjectRow>(
      `SELECT * FROM projects WHERE id = $1`,
      [projectId]
    );
    return rows[0] ?? null;
  }

  async updateProject(projectId: string, input: {
    name?: string;
    description?: string;
    location?: string;
    status?: string;
    start_at?: string;
    end_at?: string;
    total_budget?: number;
    currency?: string;
  }): Promise<ProjectRow | null> {
    const { rows } = await this.db.query<ProjectRow>(
      `UPDATE projects SET
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         location = COALESCE($4, location),
         status = COALESCE($5, status),
         start_at = COALESCE($6, start_at),
         end_at = COALESCE($7, end_at),
         total_budget = COALESCE($8, total_budget),
         currency = COALESCE($9, currency),
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [projectId, input.name, input.description, input.location, input.status, input.start_at, input.end_at, input.total_budget, input.currency]
    );
    return rows[0] ?? null;
  }
}
