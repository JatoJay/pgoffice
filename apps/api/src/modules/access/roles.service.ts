import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type RoleRow = {
  id: string;
  tenant_id: string;
  key: string;
  name: string;
  description: string | null;
  permissions: any;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class RolesService {
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
    const { rows } = await this.db.query<RoleRow>(
      "SELECT id, tenant_id, key, name, description, permissions, is_system, created_at, updated_at FROM roles ORDER BY created_at DESC"
    );
    return rows;
  }

  async create(input: { tenant_id?: string | null; key: string; name: string; description?: string | null; permissions?: any; is_system?: boolean | null }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<RoleRow>(
      "INSERT INTO roles (tenant_id, key, name, description, permissions, is_system) VALUES ($1, $2, $3, $4, $5, COALESCE($6, false)) RETURNING id, tenant_id, key, name, description, permissions, is_system, created_at, updated_at",
      [tenantId, input.key, input.name, input.description ?? null, input.permissions ?? {}, input.is_system ?? null]
    );
    return rows[0];
  }

  async update(id: string, input: { name?: string | null; description?: string | null; permissions?: any }) {
    const { rows } = await this.db.query<RoleRow>(
      "UPDATE roles SET name = COALESCE($2, name), description = COALESCE($3, description), permissions = COALESCE($4, permissions), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, key, name, description, permissions, is_system, created_at, updated_at",
      [id, input.name ?? null, input.description ?? null, input.permissions ?? null]
    );
    return rows[0] ?? null;
  }
}
