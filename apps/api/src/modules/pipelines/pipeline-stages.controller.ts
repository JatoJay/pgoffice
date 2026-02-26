import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { PipelineStagesService } from "./pipeline-stages.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  pipeline_id: z.string().uuid(),
  name: z.string().min(1),
  order_index: z.number().int().optional()
});

@Controller("pipeline-stages")
export class PipelineStagesController {
  constructor(@Inject(PipelineStagesService) private readonly stages: PipelineStagesService) {}

  @Get()
  async list() {
    const items = await this.stages.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.stages.create(body);
    return { item };
  }
}
