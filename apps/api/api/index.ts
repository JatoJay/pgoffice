import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module.js";
import { ExpressAdapter } from "@nestjs/platform-express";
import express, { Request, Response } from "express";

const server = express();

let app: any;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      logger: ["error", "warn", "log"]
    });
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
    await app.init();
  }
  return server;
}

export default async function handler(req: Request, res: Response) {
  const instance = await bootstrap();
  return instance(req, res);
}
