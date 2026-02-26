import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type SurveyRow = {
  id: string;
  tenant_id: string;
  program_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SurveyQuestionRow = {
  id: string;
  tenant_id: string;
  survey_id: string;
  question: string;
  type: string;
  options: any;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type SurveyResponseRow = {
  id: string;
  tenant_id: string;
  survey_id: string;
  profile_id: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class SurveysService {
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

  async list(programId?: string) {
    if (programId) {
      const { rows } = await this.db.query<SurveyRow>(
        "SELECT id, tenant_id, program_id, name, description, status, created_at, updated_at FROM surveys WHERE program_id = $1 ORDER BY created_at DESC",
        [programId]
      );
      return rows;
    }
    const { rows } = await this.db.query<SurveyRow>(
      "SELECT id, tenant_id, program_id, name, description, status, created_at, updated_at FROM surveys ORDER BY created_at DESC"
    );
    return rows;
  }

  async get(id: string) {
    const { rows } = await this.db.query<SurveyRow>(
      "SELECT id, tenant_id, program_id, name, description, status, created_at, updated_at FROM surveys WHERE id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: { tenant_id?: string | null; program_id: string; name: string; description?: string | null; status?: string | null }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<SurveyRow>(
      "INSERT INTO surveys (tenant_id, program_id, name, description, status) VALUES ($1, $2, $3, $4, COALESCE($5, 'draft')::survey_status) RETURNING id, tenant_id, program_id, name, description, status, created_at, updated_at",
      [tenantId, input.program_id, input.name, input.description ?? null, input.status ?? null]
    );
    return rows[0];
  }

  async update(id: string, input: { name?: string | null; description?: string | null; status?: string | null }) {
    const { rows } = await this.db.query<SurveyRow>(
      "UPDATE surveys SET name = COALESCE($2, name), description = COALESCE($3, description), status = COALESCE($4::survey_status, status), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, program_id, name, description, status, created_at, updated_at",
      [id, input.name ?? null, input.description ?? null, input.status ?? null]
    );
    return rows[0] ?? null;
  }

  async listQuestions(surveyId: string) {
    const { rows } = await this.db.query<SurveyQuestionRow>(
      "SELECT id, tenant_id, survey_id, question, type, options, order_index, created_at, updated_at FROM survey_questions WHERE survey_id = $1 ORDER BY order_index ASC",
      [surveyId]
    );
    return rows;
  }

  async createQuestion(surveyId: string, input: { question: string; type: string; options?: any; order_index?: number | null }) {
    const tenantId = this.resolveTenantId();
    const { rows } = await this.db.query<SurveyQuestionRow>(
      "INSERT INTO survey_questions (tenant_id, survey_id, question, type, options, order_index) VALUES ($1, $2, $3, $4, $5, COALESCE($6, 0)) RETURNING id, tenant_id, survey_id, question, type, options, order_index, created_at, updated_at",
      [tenantId, surveyId, input.question, input.type, input.options ?? null, input.order_index ?? null]
    );
    return rows[0];
  }

  async listResponses(surveyId: string) {
    const { rows } = await this.db.query<SurveyResponseRow>(
      "SELECT id, tenant_id, survey_id, profile_id, submitted_at, created_at, updated_at FROM survey_responses WHERE survey_id = $1 ORDER BY created_at DESC",
      [surveyId]
    );
    return rows;
  }

  async createResponse(surveyId: string, input: { profile_id?: string | null; submitted_at?: string | null }) {
    const tenantId = this.resolveTenantId();
    const { rows } = await this.db.query<SurveyResponseRow>(
      "INSERT INTO survey_responses (tenant_id, survey_id, profile_id, submitted_at) VALUES ($1, $2, $3, $4) RETURNING id, tenant_id, survey_id, profile_id, submitted_at, created_at, updated_at",
      [tenantId, surveyId, input.profile_id ?? null, input.submitted_at ?? null]
    );
    return rows[0];
  }
}
