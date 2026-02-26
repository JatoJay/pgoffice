import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { MembershipsService } from "./memberships.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  role_id: z.string().uuid()
});

@Controller("memberships")
export class MembershipsController {
  constructor(@Inject(MembershipsService) private readonly memberships: MembershipsService) {}

  @Get()
  async list() {
    const items = await this.memberships.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.memberships.create(body);
    return { item };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const item = await this.memberships.remove(id);
    if (!item) {
      throw new NotFoundException("Membership not found");
    }
    return { item };
  }
}
