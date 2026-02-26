import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Pool } from "pg";
import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import { RequestContextService } from "../common/request-context.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor(@Inject(RequestContextService) private readonly context: RequestContextService) {
    const connectionString = process.env.DATABASE_URL ?? "postgresql://pgmonitor:pgmonitor@localhost:5432/pgmonitor";
    this.pool = new Pool({ connectionString });
  }

  getPool() {
    return this.pool;
  }

  private async applyContext(client: PoolClient, contextOverride?: { tenantId?: string; isSuperAdmin?: boolean }) {
    const context = contextOverride ?? this.context.get();
    const tenantId = context?.tenantId ?? "";
    const isSuperAdmin = context?.isSuperAdmin ? "true" : "false";

    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    await client.query("SELECT set_config('app.is_super_admin', $1, true)", [isSuperAdmin]);
  }

  private async withClient<T>(
    callback: (client: PoolClient) => Promise<T>,
    contextOverride?: { tenantId?: string; isSuperAdmin?: boolean }
  ) {
    const client = await this.pool.connect();
    try {
      return await callback(client);
    } finally {
      client.release();
    }
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
    contextOverride?: { tenantId?: string; isSuperAdmin?: boolean }
  ): Promise<QueryResult<T>> {
    return this.withClient(async (client) => {
      await client.query("BEGIN");
      await this.applyContext(client, contextOverride);
      try {
        const result = await client.query<T>(text, params);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        this.logger.error("Query failed", { text, error });
        await client.query("ROLLBACK");
        throw error;
      }
    }, contextOverride);
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    contextOverride?: { tenantId?: string; isSuperAdmin?: boolean }
  ): Promise<T> {
    return this.withClient(async (client) => {
      await client.query("BEGIN");
      await this.applyContext(client, contextOverride);
      try {
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }, contextOverride);
  }

  async runMigrations() {
    const migrationsPath = path.join(__dirname, "migrations");
    const files = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    await this.pool.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())"
    );

    for (const file of files) {
      const exists = await this.pool.query(
        "SELECT 1 FROM schema_migrations WHERE id = $1",
        [file]
      );
      if (exists.rowCount && exists.rowCount > 0) {
        continue;
      }

      const migrationSql = fs.readFileSync(path.join(migrationsPath, file), "utf8");
      this.logger.log(`Applying migration ${file}`);
      await this.pool.query(migrationSql);
      await this.pool.query("INSERT INTO schema_migrations (id) VALUES ($1)", [file]);
    }
  }
}
