import { Global, Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module.js";
import { DatabaseService } from "./database.service.js";

@Global()
@Module({
  imports: [CommonModule],
  providers: [DatabaseService],
  exports: [DatabaseService]
})
export class DatabaseModule {}
