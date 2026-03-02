import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { DatabaseService } from "./db/database.service.js";

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, { logger: ["error", "warn", "log"] });
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.setGlobalPrefix("api/v1", {
    exclude: [
      { path: "healthz", method: RequestMethod.GET },
      { path: "db/health", method: RequestMethod.GET }
    ]
  });

  const database = app.get(DatabaseService);
  await database.runMigrations();

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;
  await app.listen(port, "0.0.0.0");
};

bootstrap();
