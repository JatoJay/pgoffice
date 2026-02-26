import { Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";

export type UserRow = {
  id: string;
  external_id: string | null;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class UsersService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async list() {
    const { rows } = await this.db.query<UserRow>(
      "SELECT id, external_id, email, name, avatar_url, created_at, updated_at FROM users ORDER BY created_at DESC",
      [],
      { isSuperAdmin: true }
    );
    return rows;
  }

  async get(id: string) {
    const { rows } = await this.db.query<UserRow>(
      "SELECT id, external_id, email, name, avatar_url, created_at, updated_at FROM users WHERE id = $1",
      [id],
      { isSuperAdmin: true }
    );
    return rows[0] ?? null;
  }

  async create(input: { external_id?: string | null; email?: string | null; name?: string | null; avatar_url?: string | null }) {
    const { rows } = await this.db.query<UserRow>(
      "INSERT INTO users (external_id, email, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, external_id, email, name, avatar_url, created_at, updated_at",
      [input.external_id ?? null, input.email ?? null, input.name ?? null, input.avatar_url ?? null],
      { isSuperAdmin: true }
    );
    return rows[0];
  }

  async update(id: string, input: { email?: string | null; name?: string | null; avatar_url?: string | null }) {
    const { rows } = await this.db.query<UserRow>(
      "UPDATE users SET email = COALESCE($2, email), name = COALESCE($3, name), avatar_url = COALESCE($4, avatar_url), updated_at = now() WHERE id = $1 RETURNING id, external_id, email, name, avatar_url, created_at, updated_at",
      [id, input.email ?? null, input.name ?? null, input.avatar_url ?? null],
      { isSuperAdmin: true }
    );
    return rows[0] ?? null;
  }
}
