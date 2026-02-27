import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { MilestonesService } from "./milestones.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  name: z.string().min(1),
  due_at: z.string().optional(),
  status: z.string().optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  due_at: z.string().optional(),
  status: z.string().optional()
});

@Controller("milestones")
export class MilestonesController {
  constructor(@Inject(MilestonesService) private readonly milestones: MilestonesService) {}

  @Get()
  async list() {
    const items = await this.milestones.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.milestones.create({
      tenant_id: body.tenant_id,
      project_id: body.project_id,
      name: body.name,
      due_at: body.due_at,
      status: body.status
    });
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.milestones.update(id, body);
    if (!item) {
      throw new NotFoundException("Milestone not found");
    }
    return { item };
  }
}
