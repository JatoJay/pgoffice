import { Body, Controller, Inject, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { OnboardingService } from "./onboarding.service.js";

const createSchema = z.object({
  organization_name: z.string().min(1),
  organization_slug: z.string().optional(),
  instance_name: z.string().min(1),
  instance_slug: z.string().optional(),
  subscription_tier: z.string().optional(),
  seat_limit: z.number().int().optional(),
  user_limit: z.number().int().optional(),
  program_name: z.string().optional(),
  admin_email: z.string().email().optional(),
  admin_name: z.string().optional()
});

@Controller("onboarding")
export class OnboardingController {
  constructor(@Inject(OnboardingService) private readonly onboarding: OnboardingService) {}

  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const item = await this.onboarding.create({
      organization_name: body.organization_name,
      organization_slug: body.organization_slug,
      instance_name: body.instance_name,
      instance_slug: body.instance_slug,
      subscription_tier: body.subscription_tier,
      seat_limit: body.seat_limit,
      user_limit: body.user_limit,
      program_name: body.program_name,
      admin_email: body.admin_email,
      admin_name: body.admin_name
    });
    return { item };
  }
}
