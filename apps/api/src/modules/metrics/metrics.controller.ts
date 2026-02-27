import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { MetricsService } from "./metrics.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  kpi_id: z.string().uuid(),
  name: z.string().optional(),
  source_type: z.string().min(1),
  source_config: z.any().optional()
});

@Controller("metrics")
export class MetricsController {
  constructor(@Inject(MetricsService) private readonly metrics: MetricsService) {}

  @Get()
  async list() {
    const items = await this.metrics.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.metrics.create({
      tenant_id: body.tenant_id,
      kpi_id: body.kpi_id,
      name: body.name,
      source_type: body.source_type,
      source_config: body.source_config
    });
    return { item };
  }
}
