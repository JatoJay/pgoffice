import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";
import * as crypto from "crypto";

export type UserRow = {
  id: string;
  external_id: string | null;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  status: string;
  phone: string | null;
  last_login_at: string | null;
  invited_by: string | null;
  invited_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MembershipRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  updated_at: string;
};

export type RoleRow = {
  id: string;
  tenant_id: string;
  key: string;
  name: string;
  description: string | null;
  permissions: Record<string, string[]>;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

export type InvitationRow = {
  id: string;
  tenant_id: string;
  email: string;
  role_id: string;
  token: string;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserWithRole = UserRow & {
  role_id: string;
  role_key: string;
  role_name: string;
  permissions: Record<string, string[]>;
};

@Injectable()
export class UsersService {
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

  async listUsers(): Promise<UserWithRole[]> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query<UserWithRole>(
      `SELECT u.*, m.role_id, r.key as role_key, r.name as role_name, r.permissions
       FROM users u
       JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
       JOIN roles r ON r.id = m.role_id
       ORDER BY u.created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  async getUser(id: string): Promise<UserWithRole | null> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query<UserWithRole>(
      `SELECT u.*, m.role_id, r.key as role_key, r.name as role_name, r.permissions
       FROM users u
       JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $1
       JOIN roles r ON r.id = m.role_id
       WHERE u.id = $2`,
      [tenantId, id]
    );
    return result.rows[0] || null;
  }

  async createUser(data: {
    email: string;
    name: string;
    role_id: string;
    phone?: string;
    invited_by?: string;
  }): Promise<UserWithRole> {
    const tenantId = this.resolveTenantId();

    const existingResult = await this.db.query<UserRow>(
      `SELECT * FROM users WHERE email = $1`,
      [data.email]
    );

    let user: UserRow;
    if (existingResult.rows[0]) {
      user = existingResult.rows[0];
      const membershipCheck = await this.db.query(
        `SELECT 1 FROM memberships WHERE tenant_id = $1 AND user_id = $2`,
        [tenantId, user.id]
      );
      if (membershipCheck.rows.length > 0) {
        throw new BadRequestException("User already exists in this organization");
      }
    } else {
      const userResult = await this.db.query<UserRow>(
        `INSERT INTO users (email, name, phone, status, invited_by, invited_at)
         VALUES ($1, $2, $3, 'active', $4, now())
         RETURNING *`,
        [data.email, data.name, data.phone || null, data.invited_by || null]
      );
      user = userResult.rows[0];
    }

    await this.db.query(
      `INSERT INTO memberships (tenant_id, user_id, role_id) VALUES ($1, $2, $3)`,
      [tenantId, user.id, data.role_id]
    );

    const fullUser = await this.getUser(user.id);
    if (!fullUser) throw new Error("Failed to create user");
    return fullUser;
  }

  async updateUser(id: string, data: {
    name?: string;
    phone?: string;
    status?: string;
    role_id?: string;
  }): Promise<UserWithRole | null> {
    const tenantId = this.resolveTenantId();

    const sets: string[] = ["updated_at = now()"];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      sets.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      sets.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.status !== undefined) {
      sets.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    values.push(id);
    await this.db.query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${paramIndex}`,
      values
    );

    if (data.role_id) {
      await this.db.query(
        `UPDATE memberships SET role_id = $1, updated_at = now()
         WHERE tenant_id = $2 AND user_id = $3`,
        [data.role_id, tenantId, id]
      );
    }

    return this.getUser(id);
  }

  async deleteUser(id: string): Promise<boolean> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query(
      `DELETE FROM memberships WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async listRoles(): Promise<RoleRow[]> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query<RoleRow>(
      `SELECT * FROM roles WHERE tenant_id = $1 ORDER BY name`,
      [tenantId]
    );
    return result.rows;
  }

  async createRole(data: {
    key: string;
    name: string;
    description?: string;
    permissions: Record<string, string[]>;
  }): Promise<RoleRow> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query<RoleRow>(
      `INSERT INTO roles (tenant_id, key, name, description, permissions, is_system)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [tenantId, data.key, data.name, data.description || null, JSON.stringify(data.permissions)]
    );
    return result.rows[0];
  }

  async updateRole(id: string, data: {
    name?: string;
    description?: string;
    permissions?: Record<string, string[]>;
  }): Promise<RoleRow | null> {
    const tenantId = this.resolveTenantId();

    const sets: string[] = ["updated_at = now()"];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      sets.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      sets.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.permissions !== undefined) {
      sets.push(`permissions = $${paramIndex++}`);
      values.push(JSON.stringify(data.permissions));
    }

    values.push(id, tenantId);
    const result = await this.db.query<RoleRow>(
      `UPDATE roles SET ${sets.join(", ")}
       WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex} AND is_system = false
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteRole(id: string): Promise<boolean> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query(
      `DELETE FROM roles WHERE id = $1 AND tenant_id = $2 AND is_system = false`,
      [id, tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getRoleTemplates(): Promise<{ id: string; key: string; name: string; description: string | null; permissions: Record<string, string[]> }[]> {
    const result = await this.db.query<{ id: string; key: string; name: string; description: string | null; permissions: Record<string, string[]> }>(
      `SELECT id, key, name, description, permissions FROM role_templates ORDER BY name`
    );
    return result.rows;
  }

  async initializeRolesFromTemplates(): Promise<RoleRow[]> {
    const tenantId = this.resolveTenantId();

    const templates = await this.getRoleTemplates();
    const roles: RoleRow[] = [];

    for (const template of templates) {
      const result = await this.db.query<RoleRow>(
        `INSERT INTO roles (tenant_id, key, name, description, permissions, is_system)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (tenant_id, key) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           permissions = EXCLUDED.permissions,
           updated_at = now()
         RETURNING *`,
        [tenantId, template.key, template.name, template.description, JSON.stringify(template.permissions)]
      );
      roles.push(result.rows[0]);
    }

    return roles;
  }

  async createInvitation(data: {
    email: string;
    role_id: string;
    invited_by?: string;
  }): Promise<InvitationRow> {
    const tenantId = this.resolveTenantId();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await this.db.query<InvitationRow>(
      `INSERT INTO user_invitations (tenant_id, email, role_id, token, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tenantId, data.email, data.role_id, token, data.invited_by || null, expiresAt]
    );
    return result.rows[0];
  }

  async getInvitation(token: string): Promise<InvitationRow | null> {
    const result = await this.db.query<InvitationRow>(
      `SELECT * FROM user_invitations WHERE token = $1 AND accepted_at IS NULL AND expires_at > now()`,
      [token]
    );
    return result.rows[0] || null;
  }

  async acceptInvitation(token: string, userData: { name: string; external_id?: string }): Promise<UserWithRole> {
    const invitation = await this.getInvitation(token);
    if (!invitation) {
      throw new NotFoundException("Invalid or expired invitation");
    }

    const existingResult = await this.db.query<UserRow>(
      `SELECT * FROM users WHERE email = $1`,
      [invitation.email]
    );

    let user: UserRow;
    if (existingResult.rows[0]) {
      user = existingResult.rows[0];
      await this.db.query(
        `UPDATE users SET name = COALESCE($1, name), external_id = COALESCE($2, external_id), updated_at = now() WHERE id = $3`,
        [userData.name, userData.external_id, user.id]
      );
    } else {
      const userResult = await this.db.query<UserRow>(
        `INSERT INTO users (email, name, external_id, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING *`,
        [invitation.email, userData.name, userData.external_id || null]
      );
      user = userResult.rows[0];
    }

    await this.db.query(
      `INSERT INTO memberships (tenant_id, user_id, role_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, user_id, role_id) DO NOTHING`,
      [invitation.tenant_id, user.id, invitation.role_id]
    );

    await this.db.query(
      `UPDATE user_invitations SET accepted_at = now(), updated_at = now() WHERE id = $1`,
      [invitation.id]
    );

    const ctx = this.context.get();
    this.context.set({ ...ctx, tenantId: invitation.tenant_id });

    const fullUser = await this.getUser(user.id);
    if (!fullUser) throw new Error("Failed to accept invitation");
    return fullUser;
  }

  async listInvitations(): Promise<InvitationRow[]> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query<InvitationRow>(
      `SELECT * FROM user_invitations WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  async revokeInvitation(id: string): Promise<boolean> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query(
      `DELETE FROM user_invitations WHERE id = $1 AND tenant_id = $2 AND accepted_at IS NULL`,
      [id, tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
