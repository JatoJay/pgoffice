import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { ProjectsService } from "./projects.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  program_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional()
});

@Controller("projects")
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projects: ProjectsService) {}

  @Get()
  async list(@Query("program_id") programId?: string) {
    const items = await this.projects.list(programId);
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.projects.create({
      tenant_id: body.tenant_id,
      program_id: body.program_id,
      name: body.name,
      description: body.description,
      status: body.status,
      start_at: body.start_at,
      end_at: body.end_at
    });
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.projects.get(id);
    if (!item) {
      throw new NotFoundException("Project not found");
    }
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.projects.update(id, body);
    if (!item) {
      throw new NotFoundException("Project not found");
    }
    return { item };
  }
}
