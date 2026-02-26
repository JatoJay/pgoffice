import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type OpportunityRow = {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  profile_id: string | null;
  title: string;
  amount: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class OpportunitiesService {
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
    const { rows } = await this.db.query<OpportunityRow>(
      "SELECT id, tenant_id, pipeline_id, profile_id, title, amount, status, notes, created_at, updated_at FROM opportunities ORDER BY created_at DESC"
    );
    return rows;
  }

  async create(input: {
    tenant_id?: string | null;
    pipeline_id: string;
    profile_id?: string | null;
    title: string;
    amount?: number | null;
    status?: string | null;
    notes?: string | null;
  }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<OpportunityRow>(
      "INSERT INTO opportunities (tenant_id, pipeline_id, profile_id, title, amount, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, tenant_id, pipeline_id, profile_id, title, amount, status, notes, created_at, updated_at",
      [tenantId, input.pipeline_id, input.profile_id ?? null, input.title, input.amount ?? null, input.status ?? null, input.notes ?? null]
    );
    return rows[0];
  }

  async update(id: string, input: { title?: string | null; amount?: number | null; status?: string | null; notes?: string | null }) {
    const { rows } = await this.db.query<OpportunityRow>(
      "UPDATE opportunities SET title = COALESCE($2, title), amount = COALESCE($3, amount), status = COALESCE($4, status), notes = COALESCE($5, notes), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, pipeline_id, profile_id, title, amount, status, notes, created_at, updated_at",
      [id, input.title ?? null, input.amount ?? null, input.status ?? null, input.notes ?? null]
    );
    return rows[0] ?? null;
  }

  async addHistory(id: string, input: { stage_id?: string | null; note?: string | null }) {
    const tenantId = this.resolveTenantId();
    const { rows } = await this.db.query(
      "INSERT INTO opportunity_history (tenant_id, opportunity_id, stage_id, note) VALUES ($1, $2, $3, $4) RETURNING id, opportunity_id, stage_id, note, changed_at",
      [tenantId, id, input.stage_id ?? null, input.note ?? null]
    );
    return rows[0];
  }
}
