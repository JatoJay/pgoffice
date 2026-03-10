import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";
import { DatabaseModule } from "../../db/database.module.js";
import { CommonModule } from "../../common/common.module.js";

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
