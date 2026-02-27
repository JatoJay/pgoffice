import { Body, Controller, Get, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { FilesService } from "./files.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  entity_type: z.string().min(1),
  entity_id: z.string().uuid(),
  filename: z.string().min(1),
  mime_type: z.string().optional(),
  size_bytes: z.number().int().optional(),
  storage_key: z.string().min(1),
  bucket: z.string().min(1),
  uploaded_by: z.string().uuid().optional()
});

@Controller("files")
export class FilesController {
  constructor(@Inject(FilesService) private readonly files: FilesService) {}

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.files.create({
      tenant_id: body.tenant_id,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      filename: body.filename,
      mime_type: body.mime_type,
      size_bytes: body.size_bytes,
      storage_key: body.storage_key,
      bucket: body.bucket,
      uploaded_by: body.uploaded_by
    });
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.files.get(id);
    if (!item) {
      throw new NotFoundException("File not found");
    }
    return { item };
  }
}
