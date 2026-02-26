import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { OrganizationsService } from "./organizations.service.js";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional()
});

@Controller("organizations")
export class OrganizationsController {
  constructor(@Inject(OrganizationsService) private readonly organizations: OrganizationsService) {}

  @Get()
  async list() {
    const items = await this.organizations.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.organizations.create({ name: body.name, slug: body.slug });
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.organizations.get(id);
    if (!item) {
      throw new NotFoundException("Organization not found");
    }
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.organizations.update(id, body);
    if (!item) {
      throw new NotFoundException("Organization not found");
    }
    return { item };
  }
}
