import { Module } from "@nestjs/common";
import { BudgetsController } from "./budgets.controller.js";
import { BudgetItemsController } from "./budget-items.controller.js";
import { CostCategoriesController } from "./cost-categories.controller.js";
import { FundingSourcesController } from "./funding-sources.controller.js";
import { BudgetsService } from "./budgets.service.js";
import { BudgetItemsService } from "./budget-items.service.js";
import { CostCategoriesService } from "./cost-categories.service.js";
import { FundingSourcesService } from "./funding-sources.service.js";

@Module({
  controllers: [BudgetsController, BudgetItemsController, CostCategoriesController, FundingSourcesController],
  providers: [BudgetsService, BudgetItemsService, CostCategoriesService, FundingSourcesService]
})
export class BudgetingModule {}
