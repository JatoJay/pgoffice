import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller.js";
import { MilestonesController } from "./milestones.controller.js";
import { TasksController } from "./tasks.controller.js";
import { FilesController } from "./files.controller.js";
import { ProjectsService } from "./projects.service.js";
import { MilestonesService } from "./milestones.service.js";
import { TasksService } from "./tasks.service.js";
import { FilesService } from "./files.service.js";

@Module({
  controllers: [ProjectsController, MilestonesController, TasksController, FilesController],
  providers: [ProjectsService, MilestonesService, TasksService, FilesService]
})
export class ProjectsModule {}
