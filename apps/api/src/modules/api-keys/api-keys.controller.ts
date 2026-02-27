import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { ApiKeysService } from "./api-keys.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  name: z.string().min(1)
});

@Controller("api-keys")
export class ApiKeysController {
  constructor(@Inject(ApiKeysService) private readonly apiKeys: ApiKeysService) {}

  @Get()
  async list() {
    const items = await this.apiKeys.list();
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.apiKeys.create({
      tenant_id: body.tenant_id,
      name: body.name
    });
    return { item };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const item = await this.apiKeys.revoke(id);
    if (!item) {
      throw new NotFoundException("API key not found");
    }
    return { item };
  }
}
