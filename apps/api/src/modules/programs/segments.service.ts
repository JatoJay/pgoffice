import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type SegmentRow = {
  id: string;
  tenant_id: string;
  program_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class SegmentsService {
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
    const { rows } = await this.db.query<SegmentRow>(
      "SELECT id, tenant_id, program_id, name, description, created_at, updated_at FROM segments ORDER BY created_at DESC"
    );
    return rows;
  }

  async get(id: string) {
    const { rows } = await this.db.query<SegmentRow>(
      "SELECT id, tenant_id, program_id, name, description, created_at, updated_at FROM segments WHERE id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: { tenant_id?: string | null; program_id: string; name: string; description?: string | null }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<SegmentRow>(
      "INSERT INTO segments (tenant_id, program_id, name, description) VALUES ($1, $2, $3, $4) RETURNING id, tenant_id, program_id, name, description, created_at, updated_at",
      [tenantId, input.program_id, input.name, input.description ?? null]
    );
    return rows[0];
  }

  async update(id: string, input: { name?: string | null; description?: string | null }) {
    const { rows } = await this.db.query<SegmentRow>(
      "UPDATE segments SET name = COALESCE($2, name), description = COALESCE($3, description), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, program_id, name, description, created_at, updated_at",
      [id, input.name ?? null, input.description ?? null]
    );
    return rows[0] ?? null;
  }
}
