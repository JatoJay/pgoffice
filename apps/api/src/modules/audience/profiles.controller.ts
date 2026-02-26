import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { ProfilesService } from "./profiles.service.js";

const profileTypes = ["participant", "mentor", "advisor", "partner", "investor", "staff", "contributor", "volunteer"] as const;

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  type: z.enum(profileTypes),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional()
});

const updateSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional()
});

@Controller("profiles")
export class ProfilesController {
  constructor(@Inject(ProfilesService) private readonly profiles: ProfilesService) {}

  @Get()
  async list() {
    const items = await this.profiles.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.profiles.create(body);
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.profiles.get(id);
    if (!item) {
      throw new NotFoundException("Profile not found");
    }
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.profiles.update(id, body);
    if (!item) {
      throw new NotFoundException("Profile not found");
    }
    return { item };
  }
}
