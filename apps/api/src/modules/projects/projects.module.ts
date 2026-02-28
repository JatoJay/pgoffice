import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller.js";
import { MilestonesController } from "./milestones.controller.js";
import { TasksController } from "./tasks.controller.js";
import { FilesController } from "./files.controller.js";
import { ProjectGeneratorController, PublicTaskController } from "./project-generator.controller.js";
import { ProjectsService } from "./projects.service.js";
import { MilestonesService } from "./milestones.service.js";
import { TasksService } from "./tasks.service.js";
import { FilesService } from "./files.service.js";
import { ProjectGeneratorService } from "./project-generator.service.js";
import { AiModule } from "../ai/ai.module.js";
import { EmailModule } from "../email/email.module.js";

@Module({
  imports: [AiModule, EmailModule],
  controllers: [ProjectsController, MilestonesController, TasksController, FilesController, ProjectGeneratorController, PublicTaskController],
  providers: [ProjectsService, MilestonesService, TasksService, FilesService, ProjectGeneratorService],
  exports: [ProjectGeneratorService]
})
export class ProjectsModule {}
