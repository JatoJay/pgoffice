import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type MetricRow = {
  id: string;
  tenant_id: string;
  kpi_id: string;
  name: string | null;
  source_type: string;
  source_config: any;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class MetricsService {
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
    const { rows } = await this.db.query<MetricRow>(
      "SELECT id, tenant_id, kpi_id, name, source_type, source_config, created_at, updated_at FROM metrics ORDER BY created_at DESC"
    );
    return rows;
  }

  async create(input: { tenant_id?: string | null; kpi_id: string; name?: string | null; source_type: string; source_config?: any }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<MetricRow>(
      "INSERT INTO metrics (tenant_id, kpi_id, name, source_type, source_config) VALUES ($1, $2, $3, $4, $5) RETURNING id, tenant_id, kpi_id, name, source_type, source_config, created_at, updated_at",
      [tenantId, input.kpi_id, input.name ?? null, input.source_type, input.source_config ?? null]
    );
    return rows[0];
  }
}
