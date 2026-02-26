import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { RequestContextService } from "./request-context.service.js";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @Inject(RequestContextService) private readonly context: RequestContextService
  ) {}

  use(req: any, res: any, next: () => void) {
    const bypass = (process.env.AUTH_BYPASS ?? "true").toLowerCase() === "true";
    if (req.path === "/healthz" || req.path === "/db/health") {
      return next();
    }

    const rawTenantId = req.headers["x-tenant-id"];
    const tenantId = Array.isArray(rawTenantId) ? rawTenantId[0] : rawTenantId;
    const isSuperAdmin = req.headers["x-super-admin"] === "true";
    const rawUserId = req.headers["x-user-id"];
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

    req.tenantId = tenantId;
    req.isSuperAdmin = isSuperAdmin;
    req.userId = userId;

    if (!bypass && !tenantId && !isSuperAdmin) {
      res.status(401).json({ error: "unauthorized", message: "Missing x-tenant-id header" });
      return;
    }

    if (this.context) {
      return this.context.run({ tenantId, isSuperAdmin, userId }, () => next());
    }
    return next();
  }
}
