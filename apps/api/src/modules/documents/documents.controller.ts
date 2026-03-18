import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, HttpStatus, Res, Headers, UploadedFile, UseInterceptors, Inject } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { DocumentsService } from "./documents.service.js";
import { OnlyofficeService } from "./onlyoffice.service.js";

interface UploadedFileType {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller("documents")
export class DocumentsController {
  constructor(
    @Inject(DocumentsService) private readonly documentsService: DocumentsService,
    @Inject(OnlyofficeService) private readonly onlyoffice: OnlyofficeService
  ) {}

  @Get("projects/:projectId")
  async listProjectDocuments(@Param("projectId") projectId: string) {
    const documents = await this.documentsService.listProjectDocuments(projectId);
    return { documents };
  }

  @Get(":id")
  async getDocument(@Param("id") id: string) {
    const document = await this.documentsService.getDocument(id);
    if (!document) {
      return { error: "Document not found" };
    }
    return { document };
  }

  @Get(":id/versions")
  async getDocumentVersions(@Param("id") id: string) {
    const versions = await this.documentsService.getDocumentVersions(id);
    return { versions };
  }

  @Get(":id/editor-config")
  async getEditorConfig(
    @Param("id") id: string,
    @Headers("x-tenant-id") tenantId: string,
    @Headers("host") host: string
  ) {
    const document = await this.documentsService.getDocument(id);
    if (!document || !document.file_path) {
      return { error: "Document not found or no file attached" };
    }

    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;
    const apiUrl = process.env.ONLYOFFICE_CALLBACK_URL || process.env.API_URL || baseUrl;

    const config = this.onlyoffice.getEditorConfig({
      documentId: id,
      fileName: document.file_name || document.title,
      fileUrl: `${apiUrl}/api/v1/documents/${id}/download`,
      callbackUrl: `${apiUrl}/api/v1/documents/${id}/callback`,
      userId: tenantId,
      userName: "User",
      mode: "edit"
    });

    return {
      config,
      documentServerUrl: this.onlyoffice.getDocumentServerUrl()
    };
  }

  @Get(":id/download")
  async downloadDocument(@Param("id") id: string, @Res() res: Response) {
    const document = await this.documentsService.getDocumentById(id);
    if (!document || !document.file_path) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const fileBuffer = await this.onlyoffice.getFile(document.file_path);
    if (!fileBuffer) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    res.setHeader("Content-Type", document.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${document.file_name || "document"}"`);
    res.send(fileBuffer);
  }

  @Post()
  async createDocument(
    @Body() body: {
      project_id: string;
      task_id?: string;
      title: string;
      content: string;
      content_type?: string;
      ai_generated?: boolean;
      created_by?: string;
    }
  ) {
    const document = await this.documentsService.createDocument(body);
    return { document };
  }

  @Post(":id/upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @Param("id") id: string,
    @Headers("x-tenant-id") tenantId: string,
    @UploadedFile() file: UploadedFileType
  ) {
    if (!file) {
      return { error: "No file provided" };
    }

    const document = await this.documentsService.getDocument(id);
    if (!document) {
      return { error: "Document not found" };
    }

    const filePath = await this.onlyoffice.saveFile(
      tenantId,
      id,
      file.originalname,
      file.buffer
    );

    const updatedDoc = await this.documentsService.updateDocumentFile(id, {
      file_path: filePath,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype
    });

    return { document: updatedDoc };
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadNewDocument(
    @Headers("x-tenant-id") tenantId: string,
    @UploadedFile() file: UploadedFileType,
    @Body() body: { project_id: string; task_id?: string }
  ) {
    if (!file) {
      return { error: "No file provided" };
    }

    const document = await this.documentsService.createDocument({
      project_id: body.project_id,
      task_id: body.task_id,
      title: file.originalname,
      content: "",
      content_type: "file"
    });

    const filePath = await this.onlyoffice.saveFile(
      tenantId,
      document.id,
      file.originalname,
      file.buffer
    );

    const updatedDoc = await this.documentsService.updateDocumentFile(document.id, {
      file_path: filePath,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype
    });

    return { document: updatedDoc };
  }

  @Post(":id/callback")
  async onlyofficeCallback(
    @Param("id") id: string,
    @Headers("x-tenant-id") tenantId: string,
    @Body() body: { status: number; url?: string; key?: string }
  ) {
    if (body.status === 2 || body.status === 6) {
      if (body.url) {
        try {
          const fileBuffer = await this.onlyoffice.downloadFromUrl(body.url);
          const document = await this.documentsService.getDocument(id);
          if (document) {
            await this.onlyoffice.saveFile(
              document.tenant_id,
              id,
              document.file_name || "document",
              fileBuffer
            );
            await this.documentsService.updateDocument(id, { updated_by: "onlyoffice" });
          }
        } catch (err) {
          console.error("Failed to save document from ONLYOFFICE:", err);
        }
      }
    }
    return { error: 0 };
  }

  @Patch(":id")
  async updateDocument(
    @Param("id") id: string,
    @Body() body: {
      title?: string;
      content?: string;
      status?: string;
      updated_by?: string;
    }
  ) {
    const document = await this.documentsService.updateDocument(id, body);
    if (!document) {
      return { error: "Document not found" };
    }
    return { document };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param("id") id: string) {
    const document = await this.documentsService.getDocument(id);
    if (document?.file_path) {
      await this.onlyoffice.deleteFile(document.file_path);
    }
    await this.documentsService.deleteDocument(id);
  }

  @Post("generate/task/:taskId")
  async generateFromTask(
    @Param("taskId") taskId: string,
    @Headers("x-tenant-id") tenantId: string,
    @Body() body: { project_id: string }
  ) {
    const document = await this.documentsService.generateDocumentFromTask(taskId, body.project_id, tenantId);
    return { document };
  }

  @Post("generate/project/:projectId")
  async generateProjectSummary(
    @Param("projectId") projectId: string,
    @Headers("x-tenant-id") tenantId: string
  ) {
    const document = await this.documentsService.generateProjectSummaryDocument(projectId, tenantId);
    return { document };
  }
}
