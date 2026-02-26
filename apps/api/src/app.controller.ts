import { Controller, Get } from "@nestjs/common";
import { DataService } from "./db/data.service.js";

@Controller()
export class AppController {
  constructor(private readonly dataService: DataService) {}

  @Get("/healthz")
  healthz() {
    return { status: "ok" };
  }

  @Get("/db/health")
  async dbHealth() {
    const ok = await this.dataService.ping();
    return { status: ok ? "ok" : "error" };
  }
}
