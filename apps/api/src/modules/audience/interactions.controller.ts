import { Body, Controller, Inject, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { InteractionsService } from "./interactions.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  profile_id: z.string().uuid(),
  type: z.string().min(1),
  occurred_at: z.string().optional(),
  notes: z.string().optional()
});

@Controller("interactions")
export class InteractionsController {
  constructor(@Inject(InteractionsService) private readonly interactions: InteractionsService) {}

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.interactions.create(body);
    return { item };
  }
}
