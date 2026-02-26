import { Module } from "@nestjs/common";
import { KpisController } from "./kpis.controller.js";
import { MetricsController } from "./metrics.controller.js";
import { MetricValuesController } from "./metric-values.controller.js";
import { DashboardsController } from "./dashboards.controller.js";
import { KpisService } from "./kpis.service.js";
import { MetricsService } from "./metrics.service.js";
import { MetricValuesService } from "./metric-values.service.js";
import { DashboardsService } from "./dashboards.service.js";

@Module({
  controllers: [KpisController, MetricsController, MetricValuesController, DashboardsController],
  providers: [KpisService, MetricsService, MetricValuesService, DashboardsService]
})
export class MetricsModule {}
