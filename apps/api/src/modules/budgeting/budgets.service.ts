import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type BudgetRow = {
  id: string;
  tenant_id: string;
  program_id: string | null;
  project_id: string | null;
  name: string;
  total_amount: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class BudgetsService {
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

  async list(programId?: string) {
    if (programId) {
      const { rows } = await this.db.query<BudgetRow>(
        "SELECT id, tenant_id, program_id, project_id, name, total_amount, currency, created_at, updated_at FROM budgets WHERE program_id = $1 ORDER BY created_at DESC",
        [programId]
      );
      return rows;
    }
    const { rows } = await this.db.query<BudgetRow>(
      "SELECT id, tenant_id, program_id, project_id, name, total_amount, currency, created_at, updated_at FROM budgets ORDER BY created_at DESC"
    );
    return rows;
  }

  async get(id: string) {
    const { rows } = await this.db.query<BudgetRow>(
      "SELECT id, tenant_id, program_id, project_id, name, total_amount, currency, created_at, updated_at FROM budgets WHERE id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    tenant_id?: string | null;
    program_id?: string | null;
    project_id?: string | null;
    name: string;
    total_amount?: number | null;
    currency?: string | null;
  }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<BudgetRow>(
      "INSERT INTO budgets (tenant_id, program_id, project_id, name, total_amount, currency) VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'USD')) RETURNING id, tenant_id, program_id, project_id, name, total_amount, currency, created_at, updated_at",
      [tenantId, input.program_id ?? null, input.project_id ?? null, input.name, input.total_amount ?? null, input.currency ?? null]
    );
    return rows[0];
  }

  async update(id: string, input: { name?: string | null; total_amount?: number | null; currency?: string | null }) {
    const { rows } = await this.db.query<BudgetRow>(
      "UPDATE budgets SET name = COALESCE($2, name), total_amount = COALESCE($3, total_amount), currency = COALESCE($4, currency), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, program_id, project_id, name, total_amount, currency, created_at, updated_at",
      [id, input.name ?? null, input.total_amount ?? null, input.currency ?? null]
    );
    return rows[0] ?? null;
  }
}
