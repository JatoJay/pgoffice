import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { CostCategoriesService } from "./cost-categories.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional()
});

@Controller("cost-categories")
export class CostCategoriesController {
  constructor(@Inject(CostCategoriesService) private readonly categories: CostCategoriesService) {}

  @Get()
  async list() {
    const items = await this.categories.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.categories.create({
      tenant_id: body.tenant_id,
      name: body.name,
      description: body.description
    });
    return { item };
  }
}
