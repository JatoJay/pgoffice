import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { MetricValuesService } from "./metric-values.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  metric_id: z.string().uuid(),
  subject_type: z.string().optional(),
  subject_id: z.string().uuid().optional(),
  value: z.number(),
  captured_at: z.string().optional()
});

@Controller("metric-values")
export class MetricValuesController {
  constructor(@Inject(MetricValuesService) private readonly metricValues: MetricValuesService) {}

  @Get()
  async list() {
    const items = await this.metricValues.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.metricValues.create(body);
    return { item };
  }
}
