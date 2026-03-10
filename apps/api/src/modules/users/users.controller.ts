import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, HttpStatus, Inject } from "@nestjs/common";
import { UsersService } from "./users.service.js";

@Controller("users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  async listUsers() {
    const users = await this.usersService.listUsers();
    return { users };
  }

  @Get(":id")
  async getUser(@Param("id") id: string) {
    const user = await this.usersService.getUser(id);
    if (!user) {
      return { error: "User not found" };
    }
    return { user };
  }

  @Post()
  async createUser(
    @Body() body: {
      email: string;
      name: string;
      role_id: string;
      phone?: string;
      invited_by?: string;
    }
  ) {
    const user = await this.usersService.createUser(body);
    return { user };
  }

  @Patch(":id")
  async updateUser(
    @Param("id") id: string,
    @Body() body: {
      name?: string;
      phone?: string;
      status?: string;
      role_id?: string;
    }
  ) {
    const user = await this.usersService.updateUser(id, body);
    if (!user) {
      return { error: "User not found" };
    }
    return { user };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param("id") id: string) {
    await this.usersService.deleteUser(id);
  }

  @Get("roles/list")
  async listRoles() {
    const roles = await this.usersService.listRoles();
    return { roles };
  }

  @Get("roles/templates")
  async getRoleTemplates() {
    const templates = await this.usersService.getRoleTemplates();
    return { templates };
  }

  @Post("roles")
  async createRole(
    @Body() body: {
      key: string;
      name: string;
      description?: string;
      permissions: Record<string, string[]>;
    }
  ) {
    const role = await this.usersService.createRole(body);
    return { role };
  }

  @Patch("roles/:id")
  async updateRole(
    @Param("id") id: string,
    @Body() body: {
      name?: string;
      description?: string;
      permissions?: Record<string, string[]>;
    }
  ) {
    const role = await this.usersService.updateRole(id, body);
    if (!role) {
      return { error: "Role not found or is a system role" };
    }
    return { role };
  }

  @Delete("roles/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param("id") id: string) {
    await this.usersService.deleteRole(id);
  }

  @Post("roles/initialize")
  async initializeRoles() {
    const roles = await this.usersService.initializeRolesFromTemplates();
    return { roles };
  }

  @Get("invitations/list")
  async listInvitations() {
    const invitations = await this.usersService.listInvitations();
    return { invitations };
  }

  @Post("invitations")
  async createInvitation(
    @Body() body: {
      email: string;
      role_id: string;
      invited_by?: string;
    }
  ) {
    const invitation = await this.usersService.createInvitation(body);
    return { invitation };
  }

  @Post("invitations/:token/accept")
  async acceptInvitation(
    @Param("token") token: string,
    @Body() body: {
      name: string;
      external_id?: string;
    }
  ) {
    const user = await this.usersService.acceptInvitation(token, body);
    return { user };
  }

  @Delete("invitations/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeInvitation(@Param("id") id: string) {
    await this.usersService.revokeInvitation(id);
  }
}
