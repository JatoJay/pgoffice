import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { KpisService } from "./kpis.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().optional(),
  formula: z.string().optional(),
  is_custom: z.boolean().optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  formula: z.string().optional(),
  is_custom: z.boolean().optional()
});

@Controller("kpis")
export class KpisController {
  constructor(@Inject(KpisService) private readonly kpis: KpisService) {}

  @Get()
  async list() {
    const items = await this.kpis.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.kpis.create({
      tenant_id: body.tenant_id,
      name: body.name,
      description: body.description,
      unit: body.unit,
      formula: body.formula,
      is_custom: body.is_custom
    });
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.kpis.update(id, body);
    if (!item) {
      throw new NotFoundException("KPI not found");
    }
    return { item };
  }
}
