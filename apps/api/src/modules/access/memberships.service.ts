import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type MembershipRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class MembershipsService {
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
    const { rows } = await this.db.query<MembershipRow>(
      "SELECT id, tenant_id, user_id, role_id, created_at, updated_at FROM memberships ORDER BY created_at DESC"
    );
    return rows;
  }

  async create(input: { tenant_id?: string | null; user_id: string; role_id: string }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<MembershipRow>(
      "INSERT INTO memberships (tenant_id, user_id, role_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id, tenant_id, user_id, role_id, created_at, updated_at",
      [tenantId, input.user_id, input.role_id]
    );
    return rows[0];
  }

  async remove(id: string) {
    const { rows } = await this.db.query<MembershipRow>(
      "DELETE FROM memberships WHERE id = $1 RETURNING id, tenant_id, user_id, role_id, created_at, updated_at",
      [id]
    );
    return rows[0] ?? null;
  }
}
