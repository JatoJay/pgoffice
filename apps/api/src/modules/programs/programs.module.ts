import { Module } from "@nestjs/common";
import { ProgramsController, ModulesController } from "./programs.controller.js";
import { SegmentsController } from "./segments.controller.js";
import { PhaseTasksController, TaskRemindersController } from "./phase-tasks.controller.js";
import { ProgramsService } from "./programs.service.js";
import { SegmentsService } from "./segments.service.js";
import { PhaseTasksService } from "./phase-tasks.service.js";

@Module({
  controllers: [ProgramsController, ModulesController, SegmentsController, PhaseTasksController, TaskRemindersController],
  providers: [ProgramsService, SegmentsService, PhaseTasksService]
})
export class ProgramsModule {}
