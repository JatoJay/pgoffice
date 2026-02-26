import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type DashboardRow = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  config: any;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class DashboardsService {
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
    const { rows } = await this.db.query<DashboardRow>(
      "SELECT id, tenant_id, name, description, config, created_at, updated_at FROM dashboards ORDER BY created_at DESC"
    );
    return rows;
  }

  async create(input: { tenant_id?: string | null; name: string; description?: string | null; config?: any }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<DashboardRow>(
      "INSERT INTO dashboards (tenant_id, name, description, config) VALUES ($1, $2, $3, $4) RETURNING id, tenant_id, name, description, config, created_at, updated_at",
      [tenantId, input.name, input.description ?? null, input.config]
    );
    return rows[0];
  }
}
