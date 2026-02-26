import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { TasksService } from "./tasks.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  milestone_id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.number().int().optional(),
  due_at: z.string().optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.number().int().optional(),
  due_at: z.string().optional(),
  milestone_id: z.string().uuid().optional()
});

const dependencySchema = z.object({
  depends_on_task_id: z.string().uuid()
});

@Controller("tasks")
export class TasksController {
  constructor(@Inject(TasksService) private readonly tasks: TasksService) {}

  @Get()
  async list() {
    const items = await this.tasks.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.tasks.create(body);
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.tasks.get(id);
    if (!item) {
      throw new NotFoundException("Task not found");
    }
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.tasks.update(id, body);
    if (!item) {
      throw new NotFoundException("Task not found");
    }
    return { item };
  }

  @Post(":id/dependencies")
  async addDependency(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(dependencySchema)) body: z.infer<typeof dependencySchema>
  ) {
    const item = await this.tasks.addDependency(id, body.depends_on_task_id);
    return { item };
  }
}
