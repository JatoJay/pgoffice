import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { ProgramsService } from "./programs.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  total_budget: z.number().optional(),
  currency: z.string().optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  project_id: z.string().uuid().optional(),
  total_budget: z.number().optional(),
  currency: z.string().optional()
});

const phaseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  order_index: z.number().int().optional()
});

const moduleSchema = z.object({
  modules: z
    .array(
      z.object({
        module_key: z.string().min(1),
        is_enabled: z.boolean()
      })
    )
    .min(1)
});

const segmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

@Controller("programs")
export class ProgramsController {
  constructor(@Inject(ProgramsService) private readonly programs: ProgramsService) {}

  @Get()
  async list() {
    const items = await this.programs.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.programs.create({
      tenant_id: body.tenant_id,
      project_id: body.project_id,
      name: body.name,
      description: body.description,
      status: body.status,
      start_at: body.start_at,
      end_at: body.end_at,
      total_budget: body.total_budget,
      currency: body.currency
    });
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.programs.get(id);
    if (!item) {
      throw new NotFoundException("Program not found");
    }
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.programs.update(id, body);
    if (!item) {
      throw new NotFoundException("Program not found");
    }
    return { item };
  }

  @Post(":id/activate")
  async activate(@Param("id") id: string) {
    const item = await this.programs.activate(id);
    if (!item) {
      throw new NotFoundException("Program not found");
    }
    return { item };
  }

  @Post(":id/archive")
  async archive(@Param("id") id: string) {
    const item = await this.programs.archive(id);
    if (!item) {
      throw new NotFoundException("Program not found");
    }
    return { item };
  }

  @Get(":id/phases")
  async listPhases(@Param("id") id: string) {
    const items = await this.programs.listPhases(id);
    return { items };
  }

  @Post(":id/phases")
  async createPhase(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(phaseSchema)) body: z.infer<typeof phaseSchema>
  ) {
    const item = await this.programs.createPhase(id, {
      name: body.name,
      description: body.description,
      start_at: body.start_at,
      end_at: body.end_at,
      order_index: body.order_index
    });
    return { item };
  }

  @Patch(":id/phases/:phaseId")
  async updatePhase(
    @Param("id") id: string,
    @Param("phaseId") phaseId: string,
    @Body(new ZodValidationPipe(phaseSchema.partial())) body: z.infer<typeof phaseSchema>
  ) {
    const item = await this.programs.updatePhase(id, phaseId, body);
    if (!item) {
      throw new NotFoundException("Phase not found");
    }
    return { item };
  }

  @Delete(":id/phases/:phaseId")
  async deletePhase(
    @Param("id") id: string,
    @Param("phaseId") phaseId: string
  ) {
    const deleted = await this.programs.deletePhase(id, phaseId);
    if (!deleted) {
      throw new NotFoundException("Phase not found");
    }
    return { success: true };
  }

  @Get(":id/modules")
  async getModules(@Param("id") id: string) {
    const items = await this.programs.getModules(id);
    return { items };
  }

  @Patch(":id/modules")
  async updateModules(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(moduleSchema)) body: z.infer<typeof moduleSchema>
  ) {
    const items = await this.programs.updateModules(id, body.modules.map(m => ({
      module_key: m.module_key,
      is_enabled: m.is_enabled
    })));
    return { items };
  }

  @Get(":id/segments")
  async listSegments(@Param("id") id: string) {
    const items = await this.programs.listSegments(id);
    return { items };
  }

  @Post(":id/segments")
  async createSegment(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(segmentSchema)) body: z.infer<typeof segmentSchema>
  ) {
    const item = await this.programs.createSegment(id, {
      name: body.name,
      description: body.description
    });
    return { item };
  }

  @Patch(":id/segments/:segmentId")
  async updateSegment(
    @Param("id") id: string,
    @Param("segmentId") segmentId: string,
    @Body(new ZodValidationPipe(segmentSchema.partial())) body: z.infer<typeof segmentSchema>
  ) {
    const item = await this.programs.updateSegment(id, segmentId, body);
    if (!item) {
      throw new NotFoundException("Segment not found");
    }
    return { item };
  }

  @Delete(":id/segments/:segmentId")
  async deleteSegment(
    @Param("id") id: string,
    @Param("segmentId") segmentId: string
  ) {
    const deleted = await this.programs.deleteSegment(id, segmentId);
    if (!deleted) {
      throw new NotFoundException("Segment not found");
    }
    return { success: true };
  }

  @Get(":id/events")
  async listProgramEvents(@Param("id") id: string) {
    const items = await this.programs.listProgramEvents(id);
    return { items };
  }

  @Get(":id/projects")
  async listProgramProjects(@Param("id") id: string) {
    const items = await this.programs.listProgramProjects(id);
    return { items };
  }

  @Get(":id/budgets")
  async listProgramBudgets(@Param("id") id: string) {
    const items = await this.programs.listProgramBudgets(id);
    return { items };
  }

  @Get(":id/surveys")
  async listProgramSurveys(@Param("id") id: string) {
    const items = await this.programs.listProgramSurveys(id);
    return { items };
  }

  @Get(":id/pipelines")
  async listProgramPipelines(@Param("id") id: string) {
    const items = await this.programs.listProgramPipelines(id);
    return { items };
  }

  @Get(":id/budget-notifications")
  async listBudgetNotifications(@Param("id") id: string) {
    const items = await this.programs.listBudgetNotifications(id);
    return { items };
  }

  @Post(":id/budget-notifications/:notificationId/acknowledge")
  async acknowledgeBudgetNotification(
    @Param("id") id: string,
    @Param("notificationId") notificationId: string
  ) {
    await this.programs.acknowledgeBudgetNotification(notificationId);
    return { success: true };
  }
}

@Controller("modules")
export class ModulesController {
  constructor(@Inject(ProgramsService) private readonly programs: ProgramsService) {}

  @Get()
  async list() {
    const items = await this.programs.listAvailableModules();
    return { items };
  }
}
