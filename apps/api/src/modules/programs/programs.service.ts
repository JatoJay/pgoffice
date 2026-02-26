import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type ProgramRow = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  status: string;
  start_at: string | null;
  end_at: string | null;
  total_budget: string;
  spent_budget: string;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type PhaseRow = {
  id: string;
  tenant_id: string;
  program_id: string;
  name: string;
  description: string | null;
  start_at: string | null;
  end_at: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type ModuleRow = {
  module_key: string;
  is_enabled: boolean;
  name: string | null;
  description: string | null;
};

export type AvailableModuleRow = {
  key: string;
  name: string;
  description: string | null;
  category: string | null;
  is_core: boolean;
};

export type SegmentRow = {
  id: string;
  tenant_id: string;
  program_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class ProgramsService {
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

  async list(projectId?: string) {
    if (projectId) {
      const { rows } = await this.db.query<ProgramRow>(
        "SELECT id, tenant_id, project_id, name, description, status, start_at, end_at, total_budget, spent_budget, currency, created_at, updated_at FROM programs WHERE project_id = $1 ORDER BY created_at DESC",
        [projectId]
      );
      return rows;
    }
    const { rows } = await this.db.query<ProgramRow>(
      "SELECT id, tenant_id, project_id, name, description, status, start_at, end_at, total_budget, spent_budget, currency, created_at, updated_at FROM programs ORDER BY created_at DESC"
    );
    return rows;
  }

  async get(id: string) {
    const { rows } = await this.db.query<ProgramRow>(
      "SELECT id, tenant_id, project_id, name, description, status, start_at, end_at, total_budget, spent_budget, currency, created_at, updated_at FROM programs WHERE id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    tenant_id?: string | null;
    project_id?: string | null;
    name: string;
    description?: string | null;
    status?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    total_budget?: number | null;
    currency?: string | null;
  }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<ProgramRow>(
      "INSERT INTO programs (tenant_id, project_id, name, description, status, start_at, end_at, total_budget, currency) VALUES ($1, $2, $3, $4, COALESCE($5, 'draft')::program_status, $6, $7, COALESCE($8, 0), COALESCE($9, 'USD')) RETURNING id, tenant_id, project_id, name, description, status, start_at, end_at, total_budget, spent_budget, currency, created_at, updated_at",
      [tenantId, input.project_id ?? null, input.name, input.description ?? null, input.status ?? null, input.start_at ?? null, input.end_at ?? null, input.total_budget ?? null, input.currency ?? null],
      { tenantId, isSuperAdmin: false }
    );
    return rows[0];
  }

  async update(id: string, input: {
    name?: string | null;
    description?: string | null;
    status?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    project_id?: string | null;
    total_budget?: number | null;
    currency?: string | null;
  }) {
    const { rows } = await this.db.query<ProgramRow>(
      "UPDATE programs SET name = COALESCE($2, name), description = COALESCE($3, description), status = COALESCE($4::program_status, status), start_at = COALESCE($5, start_at), end_at = COALESCE($6, end_at), project_id = COALESCE($7, project_id), total_budget = COALESCE($8, total_budget), currency = COALESCE($9, currency), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, project_id, name, description, status, start_at, end_at, total_budget, spent_budget, currency, created_at, updated_at",
      [id, input.name ?? null, input.description ?? null, input.status ?? null, input.start_at ?? null, input.end_at ?? null, input.project_id ?? null, input.total_budget ?? null, input.currency ?? null]
    );
    return rows[0] ?? null;
  }

  async activate(id: string) {
    const { rows } = await this.db.query<ProgramRow>(
      "UPDATE programs SET status = 'active', updated_at = now() WHERE id = $1 RETURNING id, tenant_id, project_id, name, description, status, start_at, end_at, total_budget, spent_budget, currency, created_at, updated_at",
      [id]
    );
    return rows[0] ?? null;
  }

  async archive(id: string) {
    const { rows } = await this.db.query<ProgramRow>(
      "UPDATE programs SET status = 'archived', updated_at = now() WHERE id = $1 RETURNING id, tenant_id, project_id, name, description, status, start_at, end_at, total_budget, spent_budget, currency, created_at, updated_at",
      [id]
    );
    return rows[0] ?? null;
  }

  async updateSpentBudget(id: string) {
    const { rows } = await this.db.query<ProgramRow>(
      `UPDATE programs SET
        spent_budget = COALESCE((SELECT SUM(spent_budget) FROM phase_tasks pt JOIN program_phases pp ON pt.phase_id = pp.id WHERE pp.program_id = $1), 0),
        updated_at = now()
      WHERE id = $1
      RETURNING id, tenant_id, project_id, name, description, status, start_at, end_at, total_budget, spent_budget, currency, created_at, updated_at`,
      [id]
    );
    return rows[0] ?? null;
  }

  async checkBudgetExhaustion(programId: string) {
    const program = await this.get(programId);
    if (!program) return null;

    const total = parseFloat(program.total_budget) || 0;
    const spent = parseFloat(program.spent_budget) || 0;
    if (total <= 0) return null;

    const percentUsed = (spent / total) * 100;
    let notificationType: string | null = null;
    let threshold = 0;

    if (percentUsed >= 100) {
      notificationType = 'exhausted';
      threshold = 100;
    } else if (percentUsed >= 90) {
      notificationType = 'warning_90';
      threshold = 90;
    } else if (percentUsed >= 75) {
      notificationType = 'warning_75';
      threshold = 75;
    }

    if (!notificationType) return null;

    const { rows: existing } = await this.db.query(
      "SELECT id FROM budget_notifications WHERE program_id = $1 AND notification_type = $2 AND acknowledged_at IS NULL",
      [programId, notificationType]
    );

    if (existing.length > 0) return null;

    const { rows } = await this.db.query(
      "INSERT INTO budget_notifications (tenant_id, program_id, notification_type, threshold_percent) VALUES ($1, $2, $3, $4) RETURNING id, notification_type, threshold_percent",
      [program.tenant_id, programId, notificationType, threshold]
    );

    return rows[0] ?? null;
  }

  async listPhases(programId: string) {
    const { rows } = await this.db.query<PhaseRow>(
      "SELECT id, tenant_id, program_id, name, description, start_at, end_at, order_index, created_at, updated_at FROM program_phases WHERE program_id = $1 ORDER BY order_index ASC",
      [programId]
    );
    return rows;
  }

  async createPhase(programId: string, input: { name: string; description?: string | null; start_at?: string | null; end_at?: string | null; order_index?: number | null }) {
    const program = await this.get(programId);
    if (!program) {
      throw new BadRequestException("Program not found");
    }
    const { rows } = await this.db.query<PhaseRow>(
      "INSERT INTO program_phases (tenant_id, program_id, name, description, start_at, end_at, order_index) VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 0)) RETURNING id, tenant_id, program_id, name, description, start_at, end_at, order_index, created_at, updated_at",
      [program.tenant_id, programId, input.name, input.description ?? null, input.start_at ?? null, input.end_at ?? null, input.order_index ?? null]
    );
    return rows[0];
  }

  async updatePhase(programId: string, phaseId: string, input: { name?: string | null; description?: string | null; start_at?: string | null; end_at?: string | null; order_index?: number | null }) {
    const { rows } = await this.db.query<PhaseRow>(
      "UPDATE program_phases SET name = COALESCE($3, name), description = COALESCE($4, description), start_at = COALESCE($5, start_at), end_at = COALESCE($6, end_at), order_index = COALESCE($7, order_index), updated_at = now() WHERE id = $1 AND program_id = $2 RETURNING id, tenant_id, program_id, name, description, start_at, end_at, order_index, created_at, updated_at",
      [phaseId, programId, input.name ?? null, input.description ?? null, input.start_at ?? null, input.end_at ?? null, input.order_index ?? null]
    );
    return rows[0] ?? null;
  }

  async deletePhase(programId: string, phaseId: string) {
    const { rowCount } = await this.db.query(
      "DELETE FROM program_phases WHERE id = $1 AND program_id = $2",
      [phaseId, programId]
    );
    return (rowCount ?? 0) > 0;
  }

  async getModules(programId: string) {
    const { rows } = await this.db.query<ModuleRow>(
      "SELECT program_modules.module_key, program_modules.is_enabled, modules.name, modules.description FROM program_modules LEFT JOIN modules ON modules.key = program_modules.module_key WHERE program_modules.program_id = $1 ORDER BY program_modules.module_key",
      [programId]
    );
    return rows;
  }

  async updateModules(programId: string, modules: { module_key: string; is_enabled: boolean }[]) {
    const program = await this.get(programId);
    if (!program) {
      throw new BadRequestException("Program not found");
    }
    const results: ModuleRow[] = [];
    for (const module of modules) {
      const { rows } = await this.db.query<ModuleRow>(
        "INSERT INTO program_modules (tenant_id, program_id, module_key, is_enabled) VALUES ($1, $2, $3, $4) ON CONFLICT (program_id, module_key) DO UPDATE SET is_enabled = EXCLUDED.is_enabled, updated_at = now() RETURNING module_key, is_enabled",
        [program.tenant_id, programId, module.module_key, module.is_enabled]
      );
      if (rows[0]) {
        results.push({ ...rows[0], name: null, description: null });
      }
    }
    return results;
  }

  async listAvailableModules() {
    const { rows } = await this.db.query<AvailableModuleRow>(
      "SELECT key, name, description, category, is_core FROM modules ORDER BY category, name"
    );
    return rows;
  }

  async listSegments(programId: string) {
    const { rows } = await this.db.query<SegmentRow>(
      "SELECT id, tenant_id, program_id, name, description, created_at, updated_at FROM segments WHERE program_id = $1 ORDER BY created_at DESC",
      [programId]
    );
    return rows;
  }

  async createSegment(programId: string, input: { name: string; description?: string | null }) {
    const program = await this.get(programId);
    if (!program) {
      throw new BadRequestException("Program not found");
    }
    const { rows } = await this.db.query<SegmentRow>(
      "INSERT INTO segments (tenant_id, program_id, name, description) VALUES ($1, $2, $3, $4) RETURNING id, tenant_id, program_id, name, description, created_at, updated_at",
      [program.tenant_id, programId, input.name, input.description ?? null]
    );
    return rows[0];
  }

  async updateSegment(programId: string, segmentId: string, input: { name?: string | null; description?: string | null }) {
    const { rows } = await this.db.query<SegmentRow>(
      "UPDATE segments SET name = COALESCE($3, name), description = COALESCE($4, description), updated_at = now() WHERE id = $1 AND program_id = $2 RETURNING id, tenant_id, program_id, name, description, created_at, updated_at",
      [segmentId, programId, input.name ?? null, input.description ?? null]
    );
    return rows[0] ?? null;
  }

  async deleteSegment(programId: string, segmentId: string) {
    const { rowCount } = await this.db.query(
      "DELETE FROM segments WHERE id = $1 AND program_id = $2",
      [segmentId, programId]
    );
    return (rowCount ?? 0) > 0;
  }

  async listProgramEvents(programId: string) {
    const { rows } = await this.db.query<Record<string, unknown>>(
      "SELECT id, name, type, status, start_at, end_at, created_at FROM events WHERE program_id = $1 ORDER BY start_at DESC NULLS LAST, created_at DESC LIMIT 10",
      [programId]
    );
    return rows;
  }

  async listProgramProjects(programId: string) {
    const { rows } = await this.db.query<Record<string, unknown>>(
      "SELECT id, name, status, start_at, end_at, created_at FROM projects WHERE program_id = $1 ORDER BY created_at DESC LIMIT 10",
      [programId]
    );
    return rows;
  }

  async listProgramBudgets(programId: string) {
    const { rows } = await this.db.query<Record<string, unknown>>(
      "SELECT id, name, total_amount, currency, created_at FROM budgets WHERE program_id = $1 ORDER BY created_at DESC LIMIT 10",
      [programId]
    );
    return rows;
  }

  async listProgramSurveys(programId: string) {
    const { rows } = await this.db.query<Record<string, unknown>>(
      "SELECT id, name, status, description, created_at FROM surveys WHERE program_id = $1 ORDER BY created_at DESC LIMIT 10",
      [programId]
    );
    return rows;
  }

  async listProgramPipelines(programId: string) {
    const { rows } = await this.db.query<Record<string, unknown>>(
      "SELECT id, name, created_at FROM pipelines WHERE program_id = $1 ORDER BY created_at DESC LIMIT 10",
      [programId]
    );
    return rows;
  }

  async listBudgetNotifications(programId: string) {
    const { rows } = await this.db.query<Record<string, unknown>>(
      "SELECT id, notification_type, threshold_percent, notified_at, acknowledged_at, created_at FROM budget_notifications WHERE program_id = $1 ORDER BY created_at DESC",
      [programId]
    );
    return rows;
  }

  async acknowledgeBudgetNotification(notificationId: string) {
    await this.db.query(
      "UPDATE budget_notifications SET acknowledged_at = now() WHERE id = $1",
      [notificationId]
    );
  }
}
