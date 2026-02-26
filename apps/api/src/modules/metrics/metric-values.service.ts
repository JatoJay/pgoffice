import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type MetricValueRow = {
  id: string;
  tenant_id: string;
  metric_id: string;
  subject_type: string | null;
  subject_id: string | null;
  value: string;
  captured_at: string;
  created_at: string;
};

@Injectable()
export class MetricValuesService {
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
    const { rows } = await this.db.query<MetricValueRow>(
      "SELECT id, tenant_id, metric_id, subject_type, subject_id, value, captured_at, created_at FROM metric_values ORDER BY captured_at DESC"
    );
    return rows;
  }

  async create(input: { tenant_id?: string | null; metric_id: string; subject_type?: string | null; subject_id?: string | null; value: number; captured_at?: string | null }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<MetricValueRow>(
      "INSERT INTO metric_values (tenant_id, metric_id, subject_type, subject_id, value, captured_at) VALUES ($1, $2, $3, $4, $5, COALESCE($6, now())) RETURNING id, tenant_id, metric_id, subject_type, subject_id, value, captured_at, created_at",
      [tenantId, input.metric_id, input.subject_type ?? null, input.subject_id ?? null, input.value, input.captured_at ?? null]
    );
    return rows[0];
  }
}
