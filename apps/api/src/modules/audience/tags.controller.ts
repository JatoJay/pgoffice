import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { TagsService } from "./tags.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  name: z.string().min(1),
  color: z.string().optional()
});

@Controller("tags")
export class TagsController {
  constructor(@Inject(TagsService) private readonly tags: TagsService) {}

  @Get()
  async list() {
    const items = await this.tags.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.tags.create(body);
    return { item };
  }
}
