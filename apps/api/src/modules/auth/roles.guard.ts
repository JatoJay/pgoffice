import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator.js";
import { DatabaseService } from "../../db/database.service.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: DatabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      return false;
    }

    const { rows } = await this.db.query<{ role_name: string }>(
      `SELECT r.name as role_name
       FROM memberships m
       JOIN roles r ON r.id = m.role_id
       WHERE m.user_id = $1`,
      [user.id],
      { isSuperAdmin: true }
    );

    const userRoles = rows.map((r) => r.role_name);
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
