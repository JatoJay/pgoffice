import { Module } from "@nestjs/common";
import { DocumentsController } from "./documents.controller.js";
import { DocumentsService } from "./documents.service.js";
import { OnlyofficeService } from "./onlyoffice.service.js";
import { CommonModule } from "../../common/common.module.js";
import { DatabaseModule } from "../../db/database.module.js";
import { AiModule } from "../ai/ai.module.js";

@Module({
  imports: [CommonModule, DatabaseModule, AiModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, OnlyofficeService],
  exports: [DocumentsService, OnlyofficeService]
})
export class DocumentsModule {}
