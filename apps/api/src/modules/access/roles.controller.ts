import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { RolesService } from "./roles.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.any().optional(),
  is_system: z.boolean().optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissions: z.any().optional()
});

@Controller("roles")
export class RolesController {
  constructor(@Inject(RolesService) private readonly roles: RolesService) {}

  @Get()
  async list() {
    const items = await this.roles.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.roles.create({
      tenant_id: body.tenant_id,
      key: body.key,
      name: body.name,
      description: body.description,
      permissions: body.permissions,
      is_system: body.is_system
    });
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.roles.update(id, body);
    if (!item) {
      throw new NotFoundException("Role not found");
    }
    return { item };
  }
}
