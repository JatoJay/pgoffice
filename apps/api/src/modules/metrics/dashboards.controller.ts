import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { DashboardsService } from "./dashboards.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  config: z.any().default({})
});

@Controller("dashboards")
export class DashboardsController {
  constructor(@Inject(DashboardsService) private readonly dashboards: DashboardsService) {}

  @Get()
  async list() {
    const items = await this.dashboards.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.dashboards.create({
      tenant_id: body.tenant_id,
      name: body.name,
      description: body.description,
      config: body.config
    });
    return { item };
  }
}
