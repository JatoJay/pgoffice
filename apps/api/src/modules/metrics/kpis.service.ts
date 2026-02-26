import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type KpiRow = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  unit: string | null;
  formula: string | null;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class KpisService {
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
    const { rows } = await this.db.query<KpiRow>(
      "SELECT id, tenant_id, name, description, unit, formula, is_custom, created_at, updated_at FROM kpis ORDER BY created_at DESC"
    );
    return rows;
  }

  async create(input: { tenant_id?: string | null; name: string; description?: string | null; unit?: string | null; formula?: string | null; is_custom?: boolean | null }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<KpiRow>(
      "INSERT INTO kpis (tenant_id, name, description, unit, formula, is_custom) VALUES ($1, $2, $3, $4, $5, COALESCE($6, true)) RETURNING id, tenant_id, name, description, unit, formula, is_custom, created_at, updated_at",
      [tenantId, input.name, input.description ?? null, input.unit ?? null, input.formula ?? null, input.is_custom ?? null]
    );
    return rows[0];
  }

  async update(id: string, input: { name?: string | null; description?: string | null; unit?: string | null; formula?: string | null; is_custom?: boolean | null }) {
    const { rows } = await this.db.query<KpiRow>(
      "UPDATE kpis SET name = COALESCE($2, name), description = COALESCE($3, description), unit = COALESCE($4, unit), formula = COALESCE($5, formula), is_custom = COALESCE($6, is_custom), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, name, description, unit, formula, is_custom, created_at, updated_at",
      [id, input.name ?? null, input.description ?? null, input.unit ?? null, input.formula ?? null, input.is_custom ?? null]
    );
    return rows[0] ?? null;
  }
}
