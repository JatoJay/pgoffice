import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type FileRow = {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_key: string;
  bucket: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class FilesService {
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

  async get(id: string) {
    const { rows } = await this.db.query<FileRow>(
      "SELECT id, tenant_id, entity_type, entity_id, filename, mime_type, size_bytes, storage_key, bucket, uploaded_by, created_at, updated_at FROM files WHERE id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    tenant_id?: string | null;
    entity_type: string;
    entity_id: string;
    filename: string;
    mime_type?: string | null;
    size_bytes?: number | null;
    storage_key: string;
    bucket: string;
    uploaded_by?: string | null;
  }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<FileRow>(
      "INSERT INTO files (tenant_id, entity_type, entity_id, filename, mime_type, size_bytes, storage_key, bucket, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, tenant_id, entity_type, entity_id, filename, mime_type, size_bytes, storage_key, bucket, uploaded_by, created_at, updated_at",
      [
        tenantId,
        input.entity_type,
        input.entity_id,
        input.filename,
        input.mime_type ?? null,
        input.size_bytes ?? null,
        input.storage_key,
        input.bucket,
        input.uploaded_by ?? null
      ]
    );
    return rows[0];
  }
}
