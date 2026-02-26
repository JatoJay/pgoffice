import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type BudgetItemRow = {
  id: string;
  tenant_id: string;
  budget_id: string;
  cost_category_id: string | null;
  funding_source_id: string | null;
  description: string | null;
  planned_amount: string | null;
  actual_amount: string | null;
  spent_at: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class BudgetItemsService {
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
    const { rows } = await this.db.query<BudgetItemRow>(
      "SELECT id, tenant_id, budget_id, cost_category_id, funding_source_id, description, planned_amount, actual_amount, spent_at, created_at, updated_at FROM budget_items ORDER BY created_at DESC"
    );
    return rows;
  }

  async create(input: {
    tenant_id?: string | null;
    budget_id: string;
    cost_category_id?: string | null;
    funding_source_id?: string | null;
    description?: string | null;
    planned_amount?: number | null;
    actual_amount?: number | null;
    spent_at?: string | null;
  }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<BudgetItemRow>(
      "INSERT INTO budget_items (tenant_id, budget_id, cost_category_id, funding_source_id, description, planned_amount, actual_amount, spent_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, tenant_id, budget_id, cost_category_id, funding_source_id, description, planned_amount, actual_amount, spent_at, created_at, updated_at",
      [
        tenantId,
        input.budget_id,
        input.cost_category_id ?? null,
        input.funding_source_id ?? null,
        input.description ?? null,
        input.planned_amount ?? null,
        input.actual_amount ?? null,
        input.spent_at ?? null
      ]
    );
    return rows[0];
  }

  async update(id: string, input: { description?: string | null; planned_amount?: number | null; actual_amount?: number | null; spent_at?: string | null }) {
    const { rows } = await this.db.query<BudgetItemRow>(
      "UPDATE budget_items SET description = COALESCE($2, description), planned_amount = COALESCE($3, planned_amount), actual_amount = COALESCE($4, actual_amount), spent_at = COALESCE($5, spent_at), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, budget_id, cost_category_id, funding_source_id, description, planned_amount, actual_amount, spent_at, created_at, updated_at",
      [id, input.description ?? null, input.planned_amount ?? null, input.actual_amount ?? null, input.spent_at ?? null]
    );
    return rows[0] ?? null;
  }
}
