import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type PipelineStageRow = {
  id: string;
  tenant_id: string;
  pipeline_id: string;
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class PipelineStagesService {
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
    const { rows } = await this.db.query<PipelineStageRow>(
      "SELECT id, tenant_id, pipeline_id, name, order_index, created_at, updated_at FROM pipeline_stages ORDER BY order_index ASC"
    );
    return rows;
  }

  async create(input: { tenant_id?: string | null; pipeline_id: string; name: string; order_index?: number | null }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<PipelineStageRow>(
      "INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, order_index) VALUES ($1, $2, $3, COALESCE($4, 0)) RETURNING id, tenant_id, pipeline_id, name, order_index, created_at, updated_at",
      [tenantId, input.pipeline_id, input.name, input.order_index ?? null]
    );
    return rows[0];
  }
}
