import { Controller, Get, Inject } from "@nestjs/common";
import { AuditLogsService } from "./audit-logs.service.js";

@Controller("audit-logs")
export class AuditLogsController {
  constructor(@Inject(AuditLogsService) private readonly auditLogs: AuditLogsService) {}

  @Get()
  async list() {
    const items = await this.auditLogs.list();
    return { items };
  }
}
