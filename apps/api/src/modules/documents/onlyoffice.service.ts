import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as path from "path";

const JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || "pgmonitor_onlyoffice_secret";
const ONLYOFFICE_URL = process.env.ONLYOFFICE_URL || "http://localhost:8080";
const STORAGE_PATH = process.env.DOCUMENT_STORAGE_PATH || "./uploads/documents";

@Injectable()
export class OnlyofficeService {
  async ensureStorageDir(): Promise<void> {
    await fs.mkdir(STORAGE_PATH, { recursive: true });
  }

  getDocumentServerUrl(): string {
    return ONLYOFFICE_URL;
  }

  createJwtToken(payload: object): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", JWT_SECRET)
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
        .createHmac("sha256", JWT_SECRET)
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

    const token = this.createJwtToken(config);
    return { ...config, token };
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
}
