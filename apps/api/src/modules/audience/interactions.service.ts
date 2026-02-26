import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type InteractionRow = {
  id: string;
  tenant_id: string;
  profile_id: string;
  type: string;
  occurred_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class InteractionsService {
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

  async create(input: { tenant_id?: string | null; profile_id: string; type: string; occurred_at?: string | null; notes?: string | null }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<InteractionRow>(
      "INSERT INTO interactions (tenant_id, profile_id, type, occurred_at, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id, tenant_id, profile_id, type, occurred_at, notes, created_at, updated_at",
      [tenantId, input.profile_id, input.type, input.occurred_at ?? null, input.notes ?? null]
    );
    return rows[0];
  }
}
