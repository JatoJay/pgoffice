import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type RelationshipRow = {
  id: string;
  tenant_id: string;
  source_profile_id: string;
  target_profile_id: string;
  type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class RelationshipsService {
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
    const { rows } = await this.db.query<RelationshipRow>(
      "SELECT id, tenant_id, source_profile_id, target_profile_id, type, notes, created_at, updated_at FROM relationships ORDER BY created_at DESC"
    );
    return rows;
  }

  async create(input: { tenant_id?: string | null; source_profile_id: string; target_profile_id: string; type: string; notes?: string | null }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<RelationshipRow>(
      "INSERT INTO relationships (tenant_id, source_profile_id, target_profile_id, type, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id, tenant_id, source_profile_id, target_profile_id, type, notes, created_at, updated_at",
      [tenantId, input.source_profile_id, input.target_profile_id, input.type, input.notes ?? null]
    );
    return rows[0];
  }
}
