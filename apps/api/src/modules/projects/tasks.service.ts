import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type TaskRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  milestone_id: string | null;
  name: string;
  description: string | null;
  status: string;
  priority: number;
  due_at: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class TasksService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(RequestContextService) private readonly context: RequestContextService
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

  async list() {
    const { rows } = await this.db.query<TaskRow>(
      "SELECT id, tenant_id, project_id, milestone_id, name, description, status, priority, due_at, created_at, updated_at FROM tasks ORDER BY created_at DESC"
    );
    return rows;
  }

  async get(id: string) {
    const { rows } = await this.db.query<TaskRow>(
      "SELECT id, tenant_id, project_id, milestone_id, name, description, status, priority, due_at, created_at, updated_at FROM tasks WHERE id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    tenant_id?: string | null;
    project_id: string;
    milestone_id?: string | null;
    name: string;
    description?: string | null;
    status?: string | null;
    priority?: number | null;
    due_at?: string | null;
  }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<TaskRow>(
      "INSERT INTO tasks (tenant_id, project_id, milestone_id, name, description, status, priority, due_at) VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'todo'), COALESCE($7, 0), $8) RETURNING id, tenant_id, project_id, milestone_id, name, description, status, priority, due_at, created_at, updated_at",
      [
        tenantId,
        input.project_id,
        input.milestone_id ?? null,
        input.name,
        input.description ?? null,
        input.status ?? null,
        input.priority ?? null,
        input.due_at ?? null
      ]
    );
    return rows[0];
  }

  async update(id: string, input: {
    name?: string | null;
    description?: string | null;
    status?: string | null;
    priority?: number | null;
    due_at?: string | null;
    milestone_id?: string | null;
  }) {
    const { rows } = await this.db.query<TaskRow>(
      "UPDATE tasks SET name = COALESCE($2, name), description = COALESCE($3, description), status = COALESCE($4, status), priority = COALESCE($5, priority), due_at = COALESCE($6, due_at), milestone_id = COALESCE($7, milestone_id), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, project_id, milestone_id, name, description, status, priority, due_at, created_at, updated_at",
      [id, input.name ?? null, input.description ?? null, input.status ?? null, input.priority ?? null, input.due_at ?? null, input.milestone_id ?? null]
    );
    return rows[0] ?? null;
  }

  async addDependency(taskId: string, dependsOnTaskId: string) {
    const tenantId = this.resolveTenantId();
    const { rows } = await this.db.query(
      "INSERT INTO task_dependencies (tenant_id, task_id, depends_on_task_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id, task_id, depends_on_task_id",
      [tenantId, taskId, dependsOnTaskId]
    );
    return rows[0] ?? null;
  }
}
