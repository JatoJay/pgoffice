import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type TaggingRow = {
  id: string;
  tenant_id: string;
  tag_id: string;
  profile_id: string;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class TaggingsService {
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

  async create(input: { tenant_id?: string | null; tag_id: string; profile_id: string }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<TaggingRow>(
      "INSERT INTO taggings (tenant_id, tag_id, profile_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id, tenant_id, tag_id, profile_id, created_at, updated_at",
      [tenantId, input.tag_id, input.profile_id]
    );
    return rows[0];
  }
}
