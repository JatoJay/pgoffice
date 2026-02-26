import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type MatchRow = {
  id: string;
  tenant_id: string;
  program_id: string;
  source_profile_id: string;
  target_profile_id: string;
  status: string;
  score: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class MatchesService {
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
    const { rows } = await this.db.query<MatchRow>(
      "SELECT id, tenant_id, program_id, source_profile_id, target_profile_id, status, score, created_at, updated_at FROM matches ORDER BY created_at DESC"
    );
    return rows;
  }

  async create(input: { tenant_id?: string | null; program_id: string; source_profile_id: string; target_profile_id: string; status?: string | null; score?: number | null }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<MatchRow>(
      "INSERT INTO matches (tenant_id, program_id, source_profile_id, target_profile_id, status, score) VALUES ($1, $2, $3, $4, COALESCE($5, 'proposed'), $6) RETURNING id, tenant_id, program_id, source_profile_id, target_profile_id, status, score, created_at, updated_at",
      [tenantId, input.program_id, input.source_profile_id, input.target_profile_id, input.status ?? null, input.score ?? null]
    );
    return rows[0];
  }

  async update(id: string, input: { status?: string | null; score?: number | null }) {
    const { rows } = await this.db.query<MatchRow>(
      "UPDATE matches SET status = COALESCE($2, status), score = COALESCE($3, score), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, program_id, source_profile_id, target_profile_id, status, score, created_at, updated_at",
      [id, input.status ?? null, input.score ?? null]
    );
    return rows[0] ?? null;
  }
}
