import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { SurveysService } from "./surveys.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  program_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional()
});

const questionSchema = z.object({
  question: z.string().min(1),
  type: z.string().min(1),
  options: z.any().optional(),
  order_index: z.number().int().optional()
});

const responseSchema = z.object({
  profile_id: z.string().uuid().optional(),
  submitted_at: z.string().optional()
});

@Controller("surveys")
export class SurveysController {
  constructor(@Inject(SurveysService) private readonly surveys: SurveysService) {}

  @Get()
  async list(@Query("program_id") programId?: string) {
    const items = await this.surveys.list(programId);
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.surveys.create(body);
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.surveys.get(id);
    if (!item) {
      throw new NotFoundException("Survey not found");
    }
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.surveys.update(id, body);
    if (!item) {
      throw new NotFoundException("Survey not found");
    }
    return { item };
  }

  @Get(":id/questions")
  async listQuestions(@Param("id") id: string) {
    const items = await this.surveys.listQuestions(id);
    return { items };
  }

  @Post(":id/questions")
  async createQuestion(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(questionSchema)) body: z.infer<typeof questionSchema>
  ) {
    const item = await this.surveys.createQuestion(id, body);
    return { item };
  }

  @Post(":id/responses")
  async createResponse(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(responseSchema)) body: z.infer<typeof responseSchema>
  ) {
    const item = await this.surveys.createResponse(id, body);
    return { item };
  }

  @Get(":id/responses")
  async listResponses(@Param("id") id: string) {
    const items = await this.surveys.listResponses(id);
    return { items };
  }
}
