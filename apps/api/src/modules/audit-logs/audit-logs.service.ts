import { Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";

export type AuditLogRow = {
  id: string;
  tenant_id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
};

@Injectable()
export class AuditLogsService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async list() {
    const { rows } = await this.db.query<AuditLogRow>(
      "SELECT id, tenant_id, actor_user_id, action, entity_type, entity_id, metadata, created_at FROM audit_logs ORDER BY created_at DESC"
    );
    return rows;
  }
}
