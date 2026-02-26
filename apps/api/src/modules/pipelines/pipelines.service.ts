import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type PipelineRow = {
  id: string;
  tenant_id: string;
  program_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class PipelinesService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(RequestContextService) private readonly context: RequestContextService
  ) {}

  private resolveTenantId(inputTenantId?: string | null) {
    const ctx = this.context.get();
    const isSuperAdmin = ctx?.isSuperAdmin ?? false;
    if (inputTenantId && ctx?.tenantId && inputTenantId !== ctx.tenantId && !isSuperAdmin) {
      throw new BadRequestException("tenant_id mismatch");
    }
    const tenantId = inputTenantId ?? ctx?.tenantId;
    if (!tenantId) {
      throw new BadRequestException("Missing tenant context");
    }
    return tenantId;
  }

  async list() {
    const { rows } = await this.db.query<PipelineRow>(
      "SELECT id, tenant_id, program_id, name, created_at, updated_at FROM pipelines ORDER BY created_at DESC"
    );
    return rows;
  }

  async get(id: string) {
    const { rows } = await this.db.query<PipelineRow>(
      "SELECT id, tenant_id, program_id, name, created_at, updated_at FROM pipelines WHERE id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: { tenant_id?: string | null; program_id: string; name: string }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<PipelineRow>(
      "INSERT INTO pipelines (tenant_id, program_id, name) VALUES ($1, $2, $3) RETURNING id, tenant_id, program_id, name, created_at, updated_at",
      [tenantId, input.program_id, input.name]
    );
    return rows[0];
  }

  async update(id: string, input: { name?: string | null }) {
    const { rows } = await this.db.query<PipelineRow>(
      "UPDATE pipelines SET name = COALESCE($2, name), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, program_id, name, created_at, updated_at",
      [id, input.name ?? null]
    );
    return rows[0] ?? null;
  }
}
