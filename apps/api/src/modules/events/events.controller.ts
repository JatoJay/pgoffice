import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { EventsService } from "./events.service.js";

const createSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  program_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string().min(1),
  status: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  location: z.string().optional(),
  virtual_url: z.string().optional(),
  capacity: z.number().int().optional()
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  location: z.string().optional(),
  virtual_url: z.string().optional(),
  capacity: z.number().int().optional()
});

const sessionSchema = z.object({
  name: z.string().min(1),
  start_at: z.string().optional(),
  end_at: z.string().optional()
});

const registrationSchema = z.object({
  profile_id: z.string().uuid(),
  status: z.string().optional()
});

const attendanceSchema = z.object({
  event_session_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  checked_in_at: z.string().optional()
});

const feedbackSchema = z.object({
  profile_id: z.string().uuid(),
  score: z.number().int().optional(),
  comments: z.string().optional()
});

@Controller("events")
export class EventsController {
  constructor(@Inject(EventsService) private readonly events: EventsService) {}

  @Get()
  async list(@Query("program_id") programId?: string) {
    const items = await this.events.list(programId);
    return { items };
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.events.create(body);
    return { item };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const item = await this.events.get(id);
    if (!item) {
      throw new NotFoundException("Event not found");
    }
    return { item };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const item = await this.events.update(id, body);
    if (!item) {
      throw new NotFoundException("Event not found");
    }
    return { item };
  }

  @Get(":id/sessions")
  async listSessions(@Param("id") id: string) {
    const items = await this.events.listSessions(id);
    return { items };
  }

  @Post(":id/sessions")
  async createSession(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sessionSchema)) body: z.infer<typeof sessionSchema>
  ) {
    const item = await this.events.createSession(id, body);
    return { item };
  }

  @Post(":id/registrations")
  async createRegistration(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(registrationSchema)) body: z.infer<typeof registrationSchema>
  ) {
    const item = await this.events.createRegistration(id, body);
    return { item };
  }

  @Post(":id/attendance")
  async createAttendance(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(attendanceSchema)) body: z.infer<typeof attendanceSchema>
  ) {
    const item = await this.events.createAttendance(id, body);
    return { item };
  }

  @Post(":id/feedback")
  async createFeedback(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(feedbackSchema)) body: z.infer<typeof feedbackSchema>
  ) {
    const item = await this.events.createFeedback(id, body);
    return { item };
  }
}
