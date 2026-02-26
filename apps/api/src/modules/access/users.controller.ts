import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { UsersService } from "./users.service.js";

const createSchema = z.object({
  external_id: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatar_url: z.string().url().optional()
});

const updateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatar_url: z.string().url().optional()
});

@Controller("users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  @Get()
  async list() {
    const items = await this.users.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.users.create(body);
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.users.get(id);
    if (!item) {
      throw new NotFoundException("User not found");
    }
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.users.update(id, body);
    if (!item) {
      throw new NotFoundException("User not found");
    }
    return { item };
  }
}
