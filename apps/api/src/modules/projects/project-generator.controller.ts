import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { ProjectGeneratorService } from "./project-generator.service.js";

const generateSchema = z.object({
  instance_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  start_at: z.string().min(1),
  end_at: z.string().min(1),
  location: z.string().min(1)
});

const assignTaskSchema = z.object({
  email: z.string().email()
});

const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
  priority: z.number().int().optional(),
  due_at: z.string().nullable().optional(),
  estimated_cost: z.number().nullable().optional(),
  order_index: z.number().int().optional()
});

const addTaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priority: z.number().int().optional(),
  due_at: z.string().optional(),
  estimated_cost: z.number().optional(),
  order_index: z.number().int().optional()
});

const updateBudgetItemSchema = z.object({
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  estimated_amount: z.number().optional(),
  actual_amount: z.number().optional()
});

const addBudgetItemSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  estimated_amount: z.number()
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  total_budget: z.number().optional(),
  currency: z.string().optional()
});

const publicUpdateSchema = z.object({
  status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
  comment: z.string().optional()
});

@Controller("ai-projects")
export class ProjectGeneratorController {
  constructor(@Inject(ProjectGeneratorService) private readonly generator: ProjectGeneratorService) {}

  @Post("generate")
  async generate(@Body(new ZodValidationPipe(generateSchema)) body: z.infer<typeof generateSchema>) {
    const result = await this.generator.generateProject({
      instance_id: body.instance_id,
      name: body.name,
      description: body.description,
      start_at: body.start_at,
      end_at: body.end_at,
      location: body.location
    });
    return result;
  }

  @Get("instances/:instanceId/projects")
  async listInstanceProjects(@Param("instanceId") instanceId: string) {
    const items = await this.generator.listInstanceProjects(instanceId);
    return { items };
  }

  @Get(":id")
  async getProject(@Param("id") id: string) {
    const project = await this.generator.getProject(id);
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    const tasks = await this.generator.listProjectTasks(id);
    const budget_items = await this.generator.listProjectBudgetItems(id);
    return { project, tasks, budget_items };
  }

  @Patch(":id")
  async updateProject(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateProjectSchema)) body: z.infer<typeof updateProjectSchema>
  ) {
    const item = await this.generator.updateProject(id, body);
    if (!item) {
      throw new NotFoundException("Project not found");
    }
    return { item };
  }

  @Get(":id/tasks")
  async listTasks(@Param("id") id: string) {
    const items = await this.generator.listProjectTasks(id);
    return { items };
  }

  @Post(":id/tasks")
  async addTask(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addTaskSchema)) body: z.infer<typeof addTaskSchema>
  ) {
    const item = await this.generator.addTask(id, {
      name: body.name,
      description: body.description,
      priority: body.priority,
      due_at: body.due_at,
      estimated_cost: body.estimated_cost,
      order_index: body.order_index
    });
    return { item };
  }

  @Patch("tasks/:taskId")
  async updateTask(
    @Param("taskId") taskId: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) body: z.infer<typeof updateTaskSchema>
  ) {
    const item = await this.generator.updateTask(taskId, body);
    if (!item) {
      throw new NotFoundException("Task not found");
    }
    return { item };
  }

  @Delete("tasks/:taskId")
  async deleteTask(@Param("taskId") taskId: string) {
    const deleted = await this.generator.deleteTask(taskId);
    if (!deleted) {
      throw new NotFoundException("Task not found");
    }
    return { success: true };
  }

  @Post("tasks/:taskId/assign")
  async assignTask(
    @Param("taskId") taskId: string,
    @Body(new ZodValidationPipe(assignTaskSchema)) body: z.infer<typeof assignTaskSchema>
  ) {
    const result = await this.generator.assignTask(taskId, body.email);
    return result;
  }

  @Get(":id/budget-items")
  async listBudgetItems(@Param("id") id: string) {
    const items = await this.generator.listProjectBudgetItems(id);
    return { items };
  }

  @Post(":id/budget-items")
  async addBudgetItem(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addBudgetItemSchema)) body: z.infer<typeof addBudgetItemSchema>
  ) {
    const item = await this.generator.addBudgetItem(id, {
      category: body.category,
      description: body.description,
      estimated_amount: body.estimated_amount
    });
    return { item };
  }

  @Patch("budget-items/:itemId")
  async updateBudgetItem(
    @Param("itemId") itemId: string,
    @Body(new ZodValidationPipe(updateBudgetItemSchema)) body: z.infer<typeof updateBudgetItemSchema>
  ) {
    const item = await this.generator.updateBudgetItem(itemId, body);
    if (!item) {
      throw new NotFoundException("Budget item not found");
    }
    return { item };
  }

  @Delete("budget-items/:itemId")
  async deleteBudgetItem(@Param("itemId") itemId: string) {
    const deleted = await this.generator.deleteBudgetItem(itemId);
    if (!deleted) {
      throw new NotFoundException("Budget item not found");
    }
    return { success: true };
  }
}

@Controller("tasks/public")
export class PublicTaskController {
  constructor(@Inject(ProjectGeneratorService) private readonly generator: ProjectGeneratorService) {}

  @Get(":token")
  async getTask(@Param("token") token: string) {
    const result = await this.generator.getTaskByToken(token);
    if (!result) {
      throw new NotFoundException("Task not found or link expired");
    }
    return result;
  }

  @Patch(":token")
  async updateTask(
    @Param("token") token: string,
    @Body(new ZodValidationPipe(publicUpdateSchema)) body: z.infer<typeof publicUpdateSchema>
  ) {
    const task = await this.generator.updateTaskByToken(token, {
      status: body.status,
      comment: body.comment
    });
    if (!task) {
      throw new NotFoundException("Task not found or link expired");
    }
    return { task };
  }
}
