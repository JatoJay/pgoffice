import { Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";

export type OrganizationRow = {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class OrganizationsService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async list() {
    const { rows } = await this.db.query<OrganizationRow>(
      "SELECT id, name, slug, created_at, updated_at FROM organizations ORDER BY created_at DESC",
      [],
      { isSuperAdmin: true }
    );
    return rows;
  }

  async get(id: string) {
    const { rows } = await this.db.query<OrganizationRow>(
      "SELECT id, name, slug, created_at, updated_at FROM organizations WHERE id = $1",
      [id],
      { isSuperAdmin: true }
    );
    return rows[0] ?? null;
  }

  async create(input: { name: string; slug?: string | null }) {
    const { rows } = await this.db.query<OrganizationRow>(
      "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug, created_at, updated_at",
      [input.name, input.slug ?? null],
      { isSuperAdmin: true }
    );
    return rows[0];
  }

  async update(id: string, input: { name?: string | null; slug?: string | null }) {
    const { rows } = await this.db.query<OrganizationRow>(
      "UPDATE organizations SET name = COALESCE($2, name), slug = COALESCE($3, slug), updated_at = now() WHERE id = $1 RETURNING id, name, slug, created_at, updated_at",
      [id, input.name ?? null, input.slug ?? null],
      { isSuperAdmin: true }
    );
    return rows[0] ?? null;
  }
}
