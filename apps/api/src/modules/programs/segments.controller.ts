import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { SegmentsService } from "./segments.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  program_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional()
});

@Controller("segments")
export class SegmentsController {
  constructor(@Inject(SegmentsService) private readonly segments: SegmentsService) {}

  @Get()
  async list() {
    const items = await this.segments.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.segments.create({
      tenant_id: body.tenant_id,
      program_id: body.program_id,
      name: body.name,
      description: body.description
    });
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.segments.get(id);
    if (!item) {
      throw new NotFoundException("Segment not found");
    }
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.segments.update(id, body);
    if (!item) {
      throw new NotFoundException("Segment not found");
    }
    return { item };
  }
}
