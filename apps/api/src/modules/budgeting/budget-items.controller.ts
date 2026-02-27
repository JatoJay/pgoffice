import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { BudgetItemsService } from "./budget-items.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  budget_id: z.string().uuid(),
  cost_category_id: z.string().uuid().optional(),
  funding_source_id: z.string().uuid().optional(),
  description: z.string().optional(),
  planned_amount: z.number().optional(),
  actual_amount: z.number().optional(),
  spent_at: z.string().optional()
});

const updateSchema = z.object({
  description: z.string().optional(),
  planned_amount: z.number().optional(),
  actual_amount: z.number().optional(),
  spent_at: z.string().optional()
});

@Controller("budget-items")
export class BudgetItemsController {
  constructor(@Inject(BudgetItemsService) private readonly budgetItems: BudgetItemsService) {}

  @Get()
  async list() {
    const items = await this.budgetItems.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.budgetItems.create({
      tenant_id: body.tenant_id,
      budget_id: body.budget_id,
      cost_category_id: body.cost_category_id,
      funding_source_id: body.funding_source_id,
      description: body.description,
      planned_amount: body.planned_amount,
      actual_amount: body.actual_amount,
      spent_at: body.spent_at
    });
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.budgetItems.update(id, body);
    if (!item) {
      throw new NotFoundException("Budget item not found");
    }
    return { item };
  }
}
