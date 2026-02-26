import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type ProjectRow = {
  id: string;
  tenant_id: string;
  program_id: string;
  name: string;
  description: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class ProjectsService {
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

  async list(programId?: string) {
    if (programId) {
      const { rows } = await this.db.query<ProjectRow>(
        "SELECT id, tenant_id, program_id, name, description, status, start_at, end_at, created_at, updated_at FROM projects WHERE program_id = $1 ORDER BY created_at DESC",
        [programId]
      );
      return rows;
    }
    const { rows } = await this.db.query<ProjectRow>(
      "SELECT id, tenant_id, program_id, name, description, status, start_at, end_at, created_at, updated_at FROM projects ORDER BY created_at DESC"
    );
    return rows;
  }

  async get(id: string) {
    const { rows } = await this.db.query<ProjectRow>(
      "SELECT id, tenant_id, program_id, name, description, status, start_at, end_at, created_at, updated_at FROM projects WHERE id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    tenant_id?: string | null;
    program_id: string;
    name: string;
    description?: string | null;
    status?: string | null;
    start_at?: string | null;
    end_at?: string | null;
  }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<ProjectRow>(
      "INSERT INTO projects (tenant_id, program_id, name, description, status, start_at, end_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, tenant_id, program_id, name, description, status, start_at, end_at, created_at, updated_at",
      [
        tenantId,
        input.program_id,
        input.name,
        input.description ?? null,
        input.status ?? null,
        input.start_at ?? null,
        input.end_at ?? null
      ]
    );
    return rows[0];
  }

  async update(id: string, input: {
    name?: string | null;
    description?: string | null;
    status?: string | null;
    start_at?: string | null;
    end_at?: string | null;
  }) {
    const { rows } = await this.db.query<ProjectRow>(
      "UPDATE projects SET name = COALESCE($2, name), description = COALESCE($3, description), status = COALESCE($4, status), start_at = COALESCE($5, start_at), end_at = COALESCE($6, end_at), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, program_id, name, description, status, start_at, end_at, created_at, updated_at",
      [id, input.name ?? null, input.description ?? null, input.status ?? null, input.start_at ?? null, input.end_at ?? null]
    );
    return rows[0] ?? null;
  }
}
