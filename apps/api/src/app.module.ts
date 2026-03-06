import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller.js";
import { TenantMiddleware } from "./common/tenant.middleware.js";
import { CommonModule } from "./common/common.module.js";
import { DatabaseModule } from "./db/database.module.js";
import { DataService } from "./db/data.service.js";
import { OrganizationsModule } from "./modules/organizations/organizations.module.js";
import { InstancesModule } from "./modules/instances/instances.module.js";
import { ProjectsModule } from "./modules/projects/projects.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { DocumentsModule } from "./modules/documents/documents.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    CommonModule,
    DatabaseModule,
    OrganizationsModule,
    InstancesModule,
    ProjectsModule,
    AuthModule,
    DocumentsModule
  ],
  controllers: [AppController],
  providers: [DataService, TenantMiddleware]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes("*");
  }
}
