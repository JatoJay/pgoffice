import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { InstancesService } from "./instances.service.js";

const createSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  status: z.string().optional(),
  subscription_tier: z.string().optional(),
  seat_limit: z.number().int().positive().optional(),
  user_limit: z.number().int().positive().optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  status: z.string().optional(),
  subscription_tier: z.string().optional(),
  seat_limit: z.number().int().positive().optional(),
  user_limit: z.number().int().positive().optional()
});

const brandingSchema = z.object({
  logo_url: z.string().url().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  accent_color: z.string().optional(),
  domain: z.string().optional()
});

@Controller("instances")
export class InstancesController {
  constructor(@Inject(InstancesService) private readonly instances: InstancesService) {}

  @Get()
  async list() {
    const items = await this.instances.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.instances.create(body);
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.instances.get(id);
    if (!item) {
      throw new NotFoundException("Instance not found");
    }
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.instances.update(id, body);
    if (!item) {
      throw new NotFoundException("Instance not found");
    }
    return { item };
  }

  @Get(":id/branding")
  async getBranding(@Param("id") id: string) {
    const item = await this.instances.getBranding(id);
    return { item: item ?? { tenant_id: id, logo_url: null, primary_color: null, secondary_color: null, accent_color: null, domain: null } };
  }

  @Patch(":id/branding")
  async updateBranding(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(brandingSchema)) body: z.infer<typeof brandingSchema>
  ) {
    const item = await this.instances.updateBranding(id, body);
    return { item };
  }
}
