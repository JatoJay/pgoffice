import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type InstanceRow = {
  id: string;
  organization_id: string;
  name: string;
  slug: string | null;
  status: string;
  subscription_tier: string | null;
  seat_limit: number | null;
  user_limit: number | null;
  created_at: string;
  updated_at: string;
};

export type BrandingRow = {
  id: string;
  tenant_id: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  domain: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class InstancesService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(RequestContextService) private readonly context: RequestContextService
  ) {}

  private resolveTenantId(inputTenantId?: string | null) {
    const ctx = this.context?.get();
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
    const { rows } = await this.db.query<InstanceRow>(
      "SELECT id, organization_id, name, slug, status, subscription_tier, seat_limit, user_limit, created_at, updated_at FROM instances ORDER BY created_at DESC"
    );
    return rows;
  }

  async get(id: string) {
    const { rows } = await this.db.query<InstanceRow>(
      "SELECT id, organization_id, name, slug, status, subscription_tier, seat_limit, user_limit, created_at, updated_at FROM instances WHERE id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    organization_id: string;
    name: string;
    slug?: string | null;
    status?: string | null;
    subscription_tier?: string | null;
    seat_limit?: number | null;
    user_limit?: number | null;
  }) {
    const { rows } = await this.db.query<InstanceRow>(
      "INSERT INTO instances (organization_id, name, slug, status, subscription_tier, seat_limit, user_limit) VALUES ($1, $2, $3, COALESCE($4, 'active'), $5, $6, $7) RETURNING id, organization_id, name, slug, status, subscription_tier, seat_limit, user_limit, created_at, updated_at",
      [
        input.organization_id,
        input.name,
        input.slug ?? null,
        input.status ?? null,
        input.subscription_tier ?? null,
        input.seat_limit ?? null,
        input.user_limit ?? null
      ],
      { isSuperAdmin: true }
    );
    return rows[0];
  }

  async update(id: string, input: {
    name?: string | null;
    slug?: string | null;
    status?: string | null;
    subscription_tier?: string | null;
    seat_limit?: number | null;
    user_limit?: number | null;
  }) {
    const { rows } = await this.db.query<InstanceRow>(
      "UPDATE instances SET name = COALESCE($2, name), slug = COALESCE($3, slug), status = COALESCE($4, status), subscription_tier = COALESCE($5, subscription_tier), seat_limit = COALESCE($6, seat_limit), user_limit = COALESCE($7, user_limit), updated_at = now() WHERE id = $1 RETURNING id, organization_id, name, slug, status, subscription_tier, seat_limit, user_limit, created_at, updated_at",
      [
        id,
        input.name ?? null,
        input.slug ?? null,
        input.status ?? null,
        input.subscription_tier ?? null,
        input.seat_limit ?? null,
        input.user_limit ?? null
      ],
      { isSuperAdmin: true }
    );
    return rows[0] ?? null;
  }

  async getBranding(id: string) {
    this.resolveTenantId(id);
    const { rows } = await this.db.query<BrandingRow>(
      "SELECT id, tenant_id, logo_url, primary_color, secondary_color, accent_color, domain, created_at, updated_at FROM instance_branding WHERE tenant_id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async updateBranding(
    id: string,
    input: {
      logo_url?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
      accent_color?: string | null;
      domain?: string | null;
    }
  ) {
    this.resolveTenantId(id);
    const { rows } = await this.db.query<BrandingRow>(
      "INSERT INTO instance_branding (tenant_id, logo_url, primary_color, secondary_color, accent_color, domain) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (tenant_id) DO UPDATE SET logo_url = COALESCE(EXCLUDED.logo_url, instance_branding.logo_url), primary_color = COALESCE(EXCLUDED.primary_color, instance_branding.primary_color), secondary_color = COALESCE(EXCLUDED.secondary_color, instance_branding.secondary_color), accent_color = COALESCE(EXCLUDED.accent_color, instance_branding.accent_color), domain = COALESCE(EXCLUDED.domain, instance_branding.domain), updated_at = now() RETURNING id, tenant_id, logo_url, primary_color, secondary_color, accent_color, domain, created_at, updated_at",
      [
        id,
        input.logo_url ?? null,
        input.primary_color ?? null,
        input.secondary_color ?? null,
        input.accent_color ?? null,
        input.domain ?? null
      ]
    );
    return rows[0];
  }
}
