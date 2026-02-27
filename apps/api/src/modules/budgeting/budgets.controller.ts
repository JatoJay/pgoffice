import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { BudgetsService } from "./budgets.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  program_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  name: z.string().min(1),
  total_amount: z.number().optional(),
  currency: z.string().optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  total_amount: z.number().optional(),
  currency: z.string().optional()
});

@Controller("budgets")
export class BudgetsController {
  constructor(@Inject(BudgetsService) private readonly budgets: BudgetsService) {}

  @Get()
  async list(@Query("program_id") programId?: string) {
    const items = await this.budgets.list(programId);
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.budgets.create({
      tenant_id: body.tenant_id,
      program_id: body.program_id,
      project_id: body.project_id,
      name: body.name,
      total_amount: body.total_amount,
      currency: body.currency
    });
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.budgets.get(id);
    if (!item) {
      throw new NotFoundException("Budget not found");
    }
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.budgets.update(id, body);
    if (!item) {
      throw new NotFoundException("Budget not found");
    }
    return { item };
  }
}
