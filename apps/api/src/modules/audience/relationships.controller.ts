import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { RelationshipsService } from "./relationships.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  source_profile_id: z.string().uuid(),
  target_profile_id: z.string().uuid(),
  type: z.string().min(1),
  notes: z.string().optional()
});

@Controller("relationships")
export class RelationshipsController {
  constructor(@Inject(RelationshipsService) private readonly relationships: RelationshipsService) {}

  @Get()
  async list() {
    const items = await this.relationships.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.relationships.create({
      tenant_id: body.tenant_id,
      source_profile_id: body.source_profile_id,
      target_profile_id: body.target_profile_id,
      type: body.type,
      notes: body.notes
    });
    return { item };
  }
}
