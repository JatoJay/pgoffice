import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type MilestoneRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  due_at: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class MilestonesService {
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
    const { rows } = await this.db.query<MilestoneRow>(
      "SELECT id, tenant_id, project_id, name, due_at, status, created_at, updated_at FROM milestones ORDER BY created_at DESC"
    );
    return rows;
  }

  async create(input: { tenant_id?: string | null; project_id: string; name: string; due_at?: string | null; status?: string | null }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<MilestoneRow>(
      "INSERT INTO milestones (tenant_id, project_id, name, due_at, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, tenant_id, project_id, name, due_at, status, created_at, updated_at",
      [tenantId, input.project_id, input.name, input.due_at ?? null, input.status ?? null]
    );
    return rows[0];
  }

  async update(id: string, input: { name?: string | null; due_at?: string | null; status?: string | null }) {
    const { rows } = await this.db.query<MilestoneRow>(
      "UPDATE milestones SET name = COALESCE($2, name), due_at = COALESCE($3, due_at), status = COALESCE($4, status), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, project_id, name, due_at, status, created_at, updated_at",
      [id, input.name ?? null, input.due_at ?? null, input.status ?? null]
    );
    return rows[0] ?? null;
  }
}
