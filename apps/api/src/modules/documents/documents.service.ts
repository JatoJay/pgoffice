import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";
import { GeminiService } from "../ai/gemini.service.js";
import { OnlyofficeService } from "./onlyoffice.service.js";

export type DocumentRow = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  task_id: string | null;
  title: string;
  content: string;
  content_type: string;
  status: string;
  version: number;
  ai_generated: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
};

export type DocumentVersionRow = {
  id: string;
  tenant_id: string;
  document_id: string;
  version: number;
  title: string;
  content: string;
  changed_by: string | null;
  created_at: string;
};

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(RequestContextService) private readonly context: RequestContextService,
    @Inject(GeminiService) private readonly gemini: GeminiService,
    @Inject(OnlyofficeService) private readonly onlyoffice: OnlyofficeService
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

  async listProjectDocuments(projectId: string): Promise<DocumentRow[]> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query<DocumentRow>(
      `SELECT * FROM documents WHERE tenant_id = $1 AND project_id = $2 ORDER BY created_at DESC`,
      [tenantId, projectId]
    );
    return result.rows;
  }

  async getDocument(id: string): Promise<DocumentRow | null> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query<DocumentRow>(
      `SELECT * FROM documents WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  async getDocumentById(id: string): Promise<DocumentRow | null> {
    const result = await this.db.query<DocumentRow>(
      `SELECT * FROM documents WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async createDocument(data: {
    project_id: string;
    task_id?: string;
    title: string;
    content: string;
    content_type?: string;
    ai_generated?: boolean;
    created_by?: string;
  }): Promise<DocumentRow> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query<DocumentRow>(
      `INSERT INTO documents (tenant_id, project_id, task_id, title, content, content_type, ai_generated, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
       RETURNING *`,
      [
        tenantId,
        data.project_id,
        data.task_id || null,
        data.title,
        data.content,
        data.content_type || "markdown",
        data.ai_generated || false,
        data.created_by || null
      ]
    );
    return result.rows[0];
  }

  async updateDocument(id: string, data: {
    title?: string;
    content?: string;
    status?: string;
    updated_by?: string;
  }): Promise<DocumentRow | null> {
    const tenantId = this.resolveTenantId();

    const existing = await this.getDocument(id);
    if (!existing) return null;

    await this.db.query(
      `INSERT INTO document_versions (tenant_id, document_id, version, title, content, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, id, existing.version, existing.title, existing.content, data.updated_by || null]
    );

    const sets: string[] = ["version = version + 1", "updated_at = now()"];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      sets.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.content !== undefined) {
      sets.push(`content = $${paramIndex++}`);
      values.push(data.content);
    }
    if (data.status !== undefined) {
      sets.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.updated_by !== undefined) {
      sets.push(`updated_by = $${paramIndex++}`);
      values.push(data.updated_by);
    }

    values.push(id, tenantId);
    const result = await this.db.query<DocumentRow>(
      `UPDATE documents SET ${sets.join(", ")} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query(
      `DELETE FROM documents WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getDocumentVersions(documentId: string): Promise<DocumentVersionRow[]> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query<DocumentVersionRow>(
      `SELECT * FROM document_versions WHERE document_id = $1 AND tenant_id = $2 ORDER BY version DESC`,
      [documentId, tenantId]
    );
    return result.rows;
  }

  async updateDocumentFile(id: string, data: {
    file_path: string;
    file_name: string;
    file_size: number;
    mime_type: string;
  }): Promise<DocumentRow | null> {
    const tenantId = this.resolveTenantId();
    const result = await this.db.query<DocumentRow>(
      `UPDATE documents SET file_path = $1, file_name = $2, file_size = $3, mime_type = $4, updated_at = now()
       WHERE id = $5 AND tenant_id = $6 RETURNING *`,
      [data.file_path, data.file_name, data.file_size, data.mime_type, id, tenantId]
    );
    return result.rows[0] || null;
  }

  async generateDocumentFromTask(taskId: string, projectId: string, inputTenantId?: string): Promise<DocumentRow> {
    const tenantId = this.resolveTenantId(inputTenantId);

    const taskResult = await this.db.query<{
      id: string;
      name: string;
      description: string | null;
      status: string;
      due_at: string | null;
      estimated_cost: number | null;
    }>(
      `SELECT id, name, description, status, due_at, estimated_cost FROM tasks WHERE id = $1 AND tenant_id = $2`,
      [taskId, tenantId]
    );
    const task = taskResult.rows[0];
    if (!task) {
      throw new BadRequestException("Task not found");
    }

    const projectResult = await this.db.query<{ name: string; description: string | null }>(
      `SELECT name, description FROM projects WHERE id = $1 AND tenant_id = $2`,
      [projectId, tenantId]
    );
    const project = projectResult.rows[0];

    const prompt = `Generate a detailed project document for the following task. Format it in Markdown with clear sections.

Project: ${project?.name || "Unknown Project"}
Project Description: ${project?.description || "N/A"}

Task: ${task.name}
Task Description: ${task.description || "No description provided"}
Status: ${task.status}
Due Date: ${task.due_at || "Not set"}
Estimated Cost: ${task.estimated_cost ? `$${task.estimated_cost}` : "Not set"}

Create a comprehensive document that includes:
1. Executive Summary
2. Objectives and Goals
3. Scope of Work
4. Deliverables
5. Timeline and Milestones
6. Resource Requirements
7. Risk Assessment
8. Success Criteria
9. Next Steps

Make it professional and actionable.`;

    const content = await this.gemini.generateText(prompt);
    const title = `${task.name} - Project Document`;

    const document = await this.createDocument({
      project_id: projectId,
      task_id: taskId,
      title,
      content,
      content_type: "docx",
      ai_generated: true
    });

    const fileData = await this.onlyoffice.createDocxFromMarkdown(
      tenantId,
      document.id,
      title,
      content
    );

    return this.updateDocumentFile(document.id, {
      file_path: fileData.filePath,
      file_name: fileData.fileName,
      file_size: fileData.fileSize,
      mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }) as Promise<DocumentRow>;
  }

  async generateProjectSummaryDocument(projectId: string, inputTenantId?: string): Promise<DocumentRow> {
    const tenantId = this.resolveTenantId(inputTenantId);

    const projectResult = await this.db.query<{
      name: string;
      description: string | null;
      location: string | null;
      total_budget: number;
      start_at: string | null;
      end_at: string | null;
    }>(
      `SELECT name, description, location, total_budget, start_at, end_at FROM projects WHERE id = $1 AND tenant_id = $2`,
      [projectId, tenantId]
    );
    const project = projectResult.rows[0];
    if (!project) {
      throw new BadRequestException("Project not found");
    }

    const tasksResult = await this.db.query<{
      name: string;
      description: string | null;
      status: string;
      estimated_cost: number | null;
    }>(
      `SELECT name, description, status, estimated_cost FROM tasks WHERE project_id = $1 AND tenant_id = $2 ORDER BY order_index`,
      [projectId, tenantId]
    );
    const tasks = tasksResult.rows;

    const budgetResult = await this.db.query<{
      category: string;
      description: string | null;
      estimated_amount: number;
    }>(
      `SELECT category, description, estimated_amount FROM project_budget_items WHERE project_id = $1 AND tenant_id = $2 ORDER BY order_index`,
      [projectId, tenantId]
    );
    const budgetItems = budgetResult.rows;

    const taskList = tasks.map(t => `- ${t.name}: ${t.description || "No description"} (Status: ${t.status}, Est: $${t.estimated_cost || 0})`).join("\n");
    const budgetList = budgetItems.map(b => `- ${b.category}: $${b.estimated_amount} - ${b.description || "No description"}`).join("\n");

    const prompt = `Generate a comprehensive project summary document in Markdown format.

Project Name: ${project.name}
Description: ${project.description || "N/A"}
Location: ${project.location || "N/A"}
Total Budget: $${project.total_budget}
Timeline: ${project.start_at || "TBD"} to ${project.end_at || "TBD"}

Tasks:
${taskList || "No tasks defined"}

Budget Breakdown:
${budgetList || "No budget items defined"}

Create a professional project summary document that includes:
1. Project Overview
2. Project Scope and Objectives
3. Key Deliverables (based on tasks)
4. Budget Summary
5. Timeline Overview
6. Team and Resources (if applicable)
7. Risk Factors
8. Success Metrics
9. Approval and Sign-off Section

Make it suitable for stakeholder review.`;

    const content = await this.gemini.generateText(prompt);
    const title = `${project.name} - Project Summary`;

    const document = await this.createDocument({
      project_id: projectId,
      title,
      content,
      content_type: "docx",
      ai_generated: true
    });

    const fileData = await this.onlyoffice.createDocxFromMarkdown(
      tenantId,
      document.id,
      title,
      content
    );

    return this.updateDocumentFile(document.id, {
      file_path: fileData.filePath,
      file_name: fileData.fileName,
      file_size: fileData.fileSize,
      mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }) as Promise<DocumentRow>;
  }
}
