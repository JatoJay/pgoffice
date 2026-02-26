import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { OpportunitiesService } from "./opportunities.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  pipeline_id: z.string().uuid(),
  profile_id: z.string().uuid().optional(),
  title: z.string().min(1),
  amount: z.number().optional(),
  status: z.string().optional(),
  notes: z.string().optional()
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  amount: z.number().optional(),
  status: z.string().optional(),
  notes: z.string().optional()
});

const historySchema = z.object({
  stage_id: z.string().uuid().optional(),
  note: z.string().optional()
});

@Controller("opportunities")
export class OpportunitiesController {
  constructor(@Inject(OpportunitiesService) private readonly opportunities: OpportunitiesService) {}

  @Get()
  async list() {
    const items = await this.opportunities.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.opportunities.create(body);
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.opportunities.update(id, body);
    if (!item) {
      throw new NotFoundException("Opportunity not found");
    }
    return { item };
  }

  @Post(":id/history")
  async addHistory(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(historySchema)) body: z.infer<typeof historySchema>
  ) {
    const item = await this.opportunities.addHistory(id, body);
    return { item };
  }
}
