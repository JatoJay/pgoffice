import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller.js";
import { RolesController } from "./roles.controller.js";
import { MembershipsController } from "./memberships.controller.js";
import { UsersService } from "./users.service.js";
import { RolesService } from "./roles.service.js";
import { MembershipsService } from "./memberships.service.js";

@Module({
  controllers: [UsersController, RolesController, MembershipsController],
  providers: [UsersService, RolesService, MembershipsService]
})
export class AccessModule {}
