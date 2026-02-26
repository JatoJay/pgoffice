import { Controller, Post, Get, Body, Inject, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() body: { email: string; password: string; name?: string }) {
    return this.authService.register(body);
  }

  @Post("login")
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  async me(@Request() req: { user: { id: string; email: string; name: string | null } }) {
    return { user: req.user };
  }
}
