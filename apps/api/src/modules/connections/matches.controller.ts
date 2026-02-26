import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { MatchesService } from "./matches.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  program_id: z.string().uuid(),
  source_profile_id: z.string().uuid(),
  target_profile_id: z.string().uuid(),
  status: z.string().optional(),
  score: z.number().optional()
});

const updateSchema = z.object({
  status: z.string().optional(),
  score: z.number().optional()
});

@Controller("matches")
export class MatchesController {
  constructor(@Inject(MatchesService) private readonly matches: MatchesService) {}

  @Get()
  async list() {
    const items = await this.matches.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.matches.create(body);
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.matches.update(id, body);
    if (!item) {
      throw new NotFoundException("Match not found");
    }
    return { item };
  }
}
