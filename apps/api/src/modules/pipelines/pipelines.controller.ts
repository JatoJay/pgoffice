import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { PipelinesService } from "./pipelines.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  program_id: z.string().uuid(),
  name: z.string().min(1)
});

const updateSchema = z.object({
  name: z.string().min(1).optional()
});

@Controller("pipelines")
export class PipelinesController {
  constructor(@Inject(PipelinesService) private readonly pipelines: PipelinesService) {}

  @Get()
  async list() {
    const items = await this.pipelines.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.pipelines.create({
      tenant_id: body.tenant_id,
      program_id: body.program_id,
      name: body.name
    });
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.pipelines.get(id);
    if (!item) {
      throw new NotFoundException("Pipeline not found");
    }
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.pipelines.update(id, body);
    if (!item) {
      throw new NotFoundException("Pipeline not found");
    }
    return { item };
  }
}
