import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type ProfileRow = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  type: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  organization: string | null;
  title: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class ProfilesService {
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
    const { rows } = await this.db.query<ProfileRow>(
      "SELECT id, tenant_id, user_id, type, first_name, last_name, display_name, email, phone, organization, title, bio, created_at, updated_at FROM profiles ORDER BY created_at DESC"
    );
    return rows;
  }

  async get(id: string) {
    const { rows } = await this.db.query<ProfileRow>(
      "SELECT id, tenant_id, user_id, type, first_name, last_name, display_name, email, phone, organization, title, bio, created_at, updated_at FROM profiles WHERE id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    tenant_id?: string | null;
    user_id?: string | null;
    type: string;
    first_name?: string | null;
    last_name?: string | null;
    display_name?: string | null;
    email?: string | null;
    phone?: string | null;
    organization?: string | null;
    title?: string | null;
    bio?: string | null;
  }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<ProfileRow>(
      "INSERT INTO profiles (tenant_id, user_id, type, first_name, last_name, display_name, email, phone, organization, title, bio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, tenant_id, user_id, type, first_name, last_name, display_name, email, phone, organization, title, bio, created_at, updated_at",
      [
        tenantId,
        input.user_id ?? null,
        input.type,
        input.first_name ?? null,
        input.last_name ?? null,
        input.display_name ?? null,
        input.email ?? null,
        input.phone ?? null,
        input.organization ?? null,
        input.title ?? null,
        input.bio ?? null
      ]
    );
    return rows[0];
  }

  async update(id: string, input: {
    first_name?: string | null;
    last_name?: string | null;
    display_name?: string | null;
    email?: string | null;
    phone?: string | null;
    organization?: string | null;
    title?: string | null;
    bio?: string | null;
  }) {
    const { rows } = await this.db.query<ProfileRow>(
      "UPDATE profiles SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name), display_name = COALESCE($4, display_name), email = COALESCE($5, email), phone = COALESCE($6, phone), organization = COALESCE($7, organization), title = COALESCE($8, title), bio = COALESCE($9, bio), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, user_id, type, first_name, last_name, display_name, email, phone, organization, title, bio, created_at, updated_at",
      [
        id,
        input.first_name ?? null,
        input.last_name ?? null,
        input.display_name ?? null,
        input.email ?? null,
        input.phone ?? null,
        input.organization ?? null,
        input.title ?? null,
        input.bio ?? null
      ]
    );
    return rows[0] ?? null;
  }
}
