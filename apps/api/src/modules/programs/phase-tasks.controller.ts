import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { PhaseTasksService } from "./phase-tasks.service.js";
import { ProgramsService } from "./programs.service.js";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional(),
  assignee_id: z.string().uuid().optional(),
  start_at: z.string().optional(),
  due_at: z.string().optional(),
  order_index: z.number().int().optional(),
  reminder_enabled: z.boolean().optional(),
  reminder_days_before: z.number().int().min(1).optional(),
  allocated_budget: z.number().optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  start_at: z.string().nullable().optional(),
  due_at: z.string().nullable().optional(),
  order_index: z.number().int().optional(),
  reminder_enabled: z.boolean().optional(),
  reminder_days_before: z.number().int().min(1).optional(),
  allocated_budget: z.number().optional(),
  spent_budget: z.number().optional()
});

@Controller("phases/:phaseId/tasks")
export class PhaseTasksController {
  constructor(
    @Inject(PhaseTasksService) private readonly tasks: PhaseTasksService,
    @Inject(ProgramsService) private readonly programs: ProgramsService
  ) {}

  @Get()
  async list(@Param("phaseId") phaseId: string) {
    const items = await this.tasks.list(phaseId);
    return { items };
  }

  @Post()
  async create(
    @Param("phaseId") phaseId: string,
    @Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>
  ) {
    const { task, programId } = await this.tasks.create(phaseId, body);
    if (programId && body.allocated_budget) {
      await this.programs.updateSpentBudget(programId);
      await this.programs.checkBudgetExhaustion(programId);
    }
    return { item: task };
  }

  @Get(":taskId")
  async get(@Param("taskId") taskId: string) {
    const item = await this.tasks.get(taskId);
    if (!item) {
      throw new NotFoundException("Task not found");
    }
    return { item };
  }

  @Patch(":taskId")
  async update(
    @Param("taskId") taskId: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const { task, programId } = await this.tasks.update(taskId, body);
    if (!task) {
      throw new NotFoundException("Task not found");
    }
    if (programId && (body.spent_budget !== undefined || body.allocated_budget !== undefined)) {
      await this.programs.updateSpentBudget(programId);
      const notification = await this.programs.checkBudgetExhaustion(programId);
      if (notification) {
        return { item: task, budget_warning: notification };
      }
    }
    return { item: task };
  }

  @Delete(":taskId")
  async delete(@Param("taskId") taskId: string) {
    const deleted = await this.tasks.delete(taskId);
    if (!deleted) {
      throw new NotFoundException("Task not found");
    }
    return { success: true };
  }

  @Get(":taskId/subtasks")
  async listSubtasks(@Param("taskId") taskId: string) {
    const items = await this.tasks.listSubtasks(taskId);
    return { items };
  }

  @Post(":taskId/subtasks")
  async createSubtask(
    @Param("taskId") taskId: string,
    @Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>
  ) {
    const item = await this.tasks.createSubtask(taskId, body);
    return { item };
  }

  @Patch(":taskId/subtasks/:subtaskId")
  async updateSubtask(
    @Param("subtaskId") subtaskId: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const { task } = await this.tasks.update(subtaskId, body);
    if (!task) {
      throw new NotFoundException("Subtask not found");
    }
    return { item: task };
  }

  @Delete(":taskId/subtasks/:subtaskId")
  async deleteSubtask(@Param("subtaskId") subtaskId: string) {
    const deleted = await this.tasks.delete(subtaskId);
    if (!deleted) {
      throw new NotFoundException("Subtask not found");
    }
    return { success: true };
  }

  @Get(":taskId/reminders")
  async listReminders(@Param("taskId") taskId: string) {
    const items = await this.tasks.listReminders(taskId);
    return { items };
  }
}

@Controller("task-reminders")
export class TaskRemindersController {
  constructor(@Inject(PhaseTasksService) private readonly tasks: PhaseTasksService) {}

  @Get("pending")
  async getPending() {
    const items = await this.tasks.getPendingReminders();
    return { items };
  }

  @Post(":id/mark-sent")
  async markSent(@Param("id") id: string) {
    await this.tasks.markReminderSent(id);
    return { success: true };
  }
}
