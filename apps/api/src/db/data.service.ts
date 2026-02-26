import { Injectable } from "@nestjs/common";
import { DatabaseService } from "./database.service.js";

@Injectable()
export class DataService {
  constructor(private readonly database: DatabaseService) {}

  async ping(): Promise<boolean> {
    const result = await this.database.query("SELECT 1 as ok", [], { isSuperAdmin: true });
    return result.rowCount === 1;
  }
}
