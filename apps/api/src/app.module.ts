import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller.js";
import { TenantMiddleware } from "./common/tenant.middleware.js";
import { CommonModule } from "./common/common.module.js";
import { DatabaseModule } from "./db/database.module.js";
import { DataService } from "./db/data.service.js";
import { OrganizationsModule } from "./modules/organizations/organizations.module.js";
import { InstancesModule } from "./modules/instances/instances.module.js";
import { AccessModule } from "./modules/access/access.module.js";
import { ProgramsModule } from "./modules/programs/programs.module.js";
import { ProjectsModule } from "./modules/projects/projects.module.js";
import { EventsModule } from "./modules/events/events.module.js";
import { BudgetingModule } from "./modules/budgeting/budgeting.module.js";
import { AudienceModule } from "./modules/audience/audience.module.js";
import { ConnectionsModule } from "./modules/connections/connections.module.js";
import { PipelinesModule } from "./modules/pipelines/pipelines.module.js";
import { SurveysModule } from "./modules/surveys/surveys.module.js";
import { MetricsModule } from "./modules/metrics/metrics.module.js";
import { ApiKeysModule } from "./modules/api-keys/api-keys.module.js";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module.js";
import { OnboardingModule } from "./modules/onboarding/onboarding.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    DatabaseModule,
    OrganizationsModule,
    InstancesModule,
    AccessModule,
    ProgramsModule,
    ProjectsModule,
    EventsModule,
    BudgetingModule,
    AudienceModule,
    ConnectionsModule,
    PipelinesModule,
    SurveysModule,
    MetricsModule,
    ApiKeysModule,
    AuditLogsModule,
    OnboardingModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [DataService, TenantMiddleware]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes("*");
  }
}
