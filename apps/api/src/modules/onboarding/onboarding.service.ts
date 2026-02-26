import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

@Injectable()
export class OnboardingService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async create(input: {
    organization_name: string;
    organization_slug?: string | null;
    instance_name: string;
    instance_slug?: string | null;
    subscription_tier?: string | null;
    seat_limit?: number | null;
    user_limit?: number | null;
    program_name?: string | null;
    admin_email?: string | null;
    admin_name?: string | null;
  }) {
    const orgName = input.organization_name.trim();
    const instanceName = input.instance_name.trim();

    if (!orgName || !instanceName) {
      throw new BadRequestException("Organization and instance name are required");
    }

    const organizationSlug = input.organization_slug ? slugify(input.organization_slug) : slugify(orgName);
    const instanceSlug = input.instance_slug ? slugify(input.instance_slug) : slugify(instanceName);

    return this.db.transaction(async (client) => {
      const orgResult = await client.query(
        "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug",
        [orgName, organizationSlug || null]
      );
      const organization = orgResult.rows[0];

      const instanceResult = await client.query(
        "INSERT INTO instances (organization_id, name, slug, status, subscription_tier, seat_limit, user_limit) VALUES ($1, $2, $3, 'active', $4, $5, $6) RETURNING id, organization_id, name, slug, status",
        [
          organization.id,
          instanceName,
          instanceSlug || null,
          input.subscription_tier ?? "starter",
          input.seat_limit ?? 50,
          input.user_limit ?? 50
        ]
      );
      const instance = instanceResult.rows[0];

      await client.query("SELECT set_config('app.tenant_id', $1, true)", [instance.id]);
      await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

      await client.query(
        "INSERT INTO roles (tenant_id, key, name, description, permissions, is_system) SELECT $1, key, name, description, permissions, true FROM role_templates ON CONFLICT DO NOTHING",
        [instance.id]
      );

      let user = null;
      if (input.admin_email || input.admin_name) {
        const userResult = await client.query(
          "INSERT INTO users (email, external_id, name) VALUES ($1, $2, $3) RETURNING id, email, name",
          [
            input.admin_email ?? null,
            input.admin_email ?? null,
            input.admin_name ?? null
          ]
        );
        user = userResult.rows[0];

        const roleResult = await client.query(
          "SELECT id FROM roles WHERE tenant_id = $1 AND key = 'org_admin' LIMIT 1",
          [instance.id]
        );
        const roleId = roleResult.rows[0]?.id;
        if (roleId) {
          await client.query(
            "INSERT INTO memberships (tenant_id, user_id, role_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
            [instance.id, user.id, roleId]
          );
        }
      }

      let program = null;
      if (input.program_name) {
        const programResult = await client.query(
          "INSERT INTO programs (tenant_id, name, status) VALUES ($1, $2, 'active') RETURNING id, name, status",
          [instance.id, input.program_name]
        );
        program = programResult.rows[0];

        await client.query(
          "INSERT INTO program_modules (tenant_id, program_id, module_key, is_enabled) SELECT $1, $2, key, true FROM modules ON CONFLICT DO NOTHING",
          [instance.id, program.id]
        );
      }

      return {
        organization,
        instance,
        program,
        adminUser: user
      };
    }, { isSuperAdmin: true });
  }
}
