import { Body, Controller, Inject, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { TaggingsService } from "./taggings.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  tag_id: z.string().uuid(),
  profile_id: z.string().uuid()
});

@Controller("taggings")
export class TaggingsController {
  constructor(@Inject(TaggingsService) private readonly taggings: TaggingsService) {}

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.taggings.create({
      tenant_id: body.tenant_id,
      tag_id: body.tag_id,
      profile_id: body.profile_id
    });
    return { item };
  }
}
