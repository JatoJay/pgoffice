import { Module } from "@nestjs/common";
import { SurveysController } from "./surveys.controller.js";
import { SurveysService } from "./surveys.service.js";

@Module({
  controllers: [SurveysController],
  providers: [SurveysService]
})
export class SurveysModule {}
