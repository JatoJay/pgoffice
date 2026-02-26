import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "crypto";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type ApiKeyRow = {
  id: string;
  tenant_id: string;
  name: string;
  key_hash: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
};

@Injectable()
export class ApiKeysService {
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

  private hashKey(raw: string) {
    const salt = process.env.API_KEY_SALT ?? "dev-salt";
    return createHash("sha256").update(`${salt}:${raw}`).digest("hex");
  }

  async list() {
    const { rows } = await this.db.query<ApiKeyRow>(
      "SELECT id, tenant_id, name, key_hash, last_used_at, created_at, revoked_at FROM api_keys WHERE revoked_at IS NULL ORDER BY created_at DESC"
    );
    return rows;
  }

  async create(input: { tenant_id?: string | null; name: string }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const raw = `pgm_${randomUUID().replace(/-/g, "")}`;
    const keyHash = this.hashKey(raw);
    const { rows } = await this.db.query<ApiKeyRow>(
      "INSERT INTO api_keys (tenant_id, name, key_hash) VALUES ($1, $2, $3) RETURNING id, tenant_id, name, key_hash, last_used_at, created_at, revoked_at",
      [tenantId, input.name, keyHash]
    );
    return { apiKey: rows[0], raw };
  }

  async revoke(id: string) {
    const { rows } = await this.db.query<ApiKeyRow>(
      "UPDATE api_keys SET revoked_at = now() WHERE id = $1 RETURNING id, tenant_id, name, key_hash, last_used_at, created_at, revoked_at",
      [id]
    );
    return rows[0] ?? null;
  }
}
