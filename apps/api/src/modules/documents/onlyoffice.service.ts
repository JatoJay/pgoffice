import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

const STORAGE_PATH = process.env.DOCUMENT_STORAGE_PATH || "./uploads/documents";

@Injectable()
export class OnlyofficeService {
  private getJwtSecret(): string {
    return process.env.ONLYOFFICE_JWT_SECRET || "pgmonitor_onlyoffice_secret";
  }

  private isJwtEnabled(): boolean {
    return process.env.ONLYOFFICE_JWT_ENABLED !== "false";
  }

  async ensureStorageDir(): Promise<void> {
    await fs.mkdir(STORAGE_PATH, { recursive: true });
  }

  getDocumentServerUrl(): string {
    return process.env.ONLYOFFICE_URL || "http://localhost";
  }

  createJwtToken(payload: object): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", this.getJwtSecret())
      .update(`${header}.${body}`)
      .digest("base64url");
    return `${header}.${body}.${signature}`;
  }

  verifyJwtToken(token: string): object | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const [header, body, signature] = parts;
      const expectedSignature = crypto
        .createHmac("sha256", this.getJwtSecret())
        .update(`${header}.${body}`)
        .digest("base64url");
      if (signature !== expectedSignature) return null;
      return JSON.parse(Buffer.from(body, "base64url").toString());
    } catch {
      return null;
    }
  }

  getEditorConfig(params: {
    documentId: string;
    fileName: string;
    fileUrl: string;
    callbackUrl: string;
    userId?: string;
    userName?: string;
    mode?: "edit" | "view";
  }): object {
    const fileExt = path.extname(params.fileName).slice(1).toLowerCase();
    const documentType = this.getDocumentType(fileExt);

    const config = {
      document: {
        fileType: fileExt,
        key: `${params.documentId}_${Date.now()}`,
        title: params.fileName,
        url: params.fileUrl,
      },
      documentType,
      editorConfig: {
        callbackUrl: params.callbackUrl,
        mode: params.mode || "edit",
        user: {
          id: params.userId || "anonymous",
          name: params.userName || "Anonymous",
        },
        customization: {
          autosave: true,
          chat: false,
          comments: true,
          compactHeader: true,
          compactToolbar: false,
          forcesave: true,
          help: false,
          hideRightMenu: false,
          toolbarNoTabs: false,
        },
      },
    };

    if (this.isJwtEnabled()) {
      const token = this.createJwtToken(config);
      return { ...config, token };
    }
    return config;
  }

  getDocumentType(ext: string): "word" | "cell" | "slide" {
    const wordExts = ["doc", "docx", "odt", "rtf", "txt", "html", "htm", "pdf"];
    const cellExts = ["xls", "xlsx", "ods", "csv"];
    const slideExts = ["ppt", "pptx", "odp"];

    if (wordExts.includes(ext)) return "word";
    if (cellExts.includes(ext)) return "cell";
    if (slideExts.includes(ext)) return "slide";
    return "word";
  }

  async saveFile(tenantId: string, documentId: string, fileName: string, buffer: Buffer): Promise<string> {
    await this.ensureStorageDir();
    const tenantDir = path.join(STORAGE_PATH, tenantId);
    await fs.mkdir(tenantDir, { recursive: true });

    const ext = path.extname(fileName);
    const filePath = path.join(tenantDir, `${documentId}${ext}`);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  async getFile(filePath: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist
    }
  }

  async downloadFromUrl(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  async markdownToDocx(markdownContent: string, title: string): Promise<Buffer> {
    const lines = markdownContent.split("\n");
    const children: Paragraph[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        children.push(new Paragraph({}));
        continue;
      }

      if (trimmed.startsWith("# ")) {
        children.push(new Paragraph({
          text: trimmed.substring(2),
          heading: HeadingLevel.HEADING_1
        }));
      } else if (trimmed.startsWith("## ")) {
        children.push(new Paragraph({
          text: trimmed.substring(3),
          heading: HeadingLevel.HEADING_2
        }));
      } else if (trimmed.startsWith("### ")) {
        children.push(new Paragraph({
          text: trimmed.substring(4),
          heading: HeadingLevel.HEADING_3
        }));
      } else if (trimmed.startsWith("#### ")) {
        children.push(new Paragraph({
          text: trimmed.substring(5),
          heading: HeadingLevel.HEADING_4
        }));
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        children.push(new Paragraph({
          text: trimmed.substring(2),
          bullet: { level: 0 }
        }));
      } else if (/^\d+\.\s/.test(trimmed)) {
        const text = trimmed.replace(/^\d+\.\s/, "");
        children.push(new Paragraph({
          text,
          numbering: { reference: "default-numbering", level: 0 }
        }));
      } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        children.push(new Paragraph({
          children: [new TextRun({ text: trimmed.slice(2, -2), bold: true })]
        }));
      } else {
        children.push(new Paragraph({ text: trimmed }));
      }
    }

    const doc = new Document({
      title,
      numbering: {
        config: [{
          reference: "default-numbering",
          levels: [{
            level: 0,
            format: "decimal",
            text: "%1.",
            alignment: "start"
          }]
        }]
      },
      sections: [{ children }]
    });

    return Buffer.from(await Packer.toBuffer(doc));
  }

  async createDocxFromMarkdown(
    tenantId: string,
    documentId: string,
    title: string,
    markdownContent: string
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const buffer = await this.markdownToDocx(markdownContent, title);
    const fileName = `${title.replace(/[^a-zA-Z0-9-_ ]/g, "")}.docx`;
    const filePath = await this.saveFile(tenantId, documentId, fileName, buffer);
    return { filePath, fileName, fileSize: buffer.length };
  }
}
