import { Module } from "@nestjs/common";
import { PipelinesController } from "./pipelines.controller.js";
import { PipelineStagesController } from "./pipeline-stages.controller.js";
import { OpportunitiesController } from "./opportunities.controller.js";
import { PipelinesService } from "./pipelines.service.js";
import { PipelineStagesService } from "./pipeline-stages.service.js";
import { OpportunitiesService } from "./opportunities.service.js";

@Module({
  controllers: [PipelinesController, PipelineStagesController, OpportunitiesController],
  providers: [PipelinesService, PipelineStagesService, OpportunitiesService]
})
export class PipelinesModule {}
