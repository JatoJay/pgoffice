import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../../db/database.service.js";
import { RequestContextService } from "../../common/request-context.service.js";

export type EventRow = {
  id: string;
  tenant_id: string;
  program_id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  virtual_url: string | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
};

export type EventSessionRow = {
  id: string;
  tenant_id: string;
  event_id: string;
  name: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class EventsService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(RequestContextService) private readonly context: RequestContextService
  ) {}

  private resolveTenantId(inputTenantId?: string | null) {
    const ctx = this.context.get();
    const isSuperAdmin = ctx?.isSuperAdmin ?? false;
    if (inputTenantId && ctx?.tenantId && inputTenantId !== ctx.tenantId && !isSuperAdmin) {
      throw new BadRequestException("tenant_id mismatch");
    }
    const tenantId = inputTenantId ?? ctx?.tenantId;
    if (!tenantId) {
      throw new BadRequestException("Missing tenant context");
    }
    return tenantId;
  }

  async list(programId?: string) {
    if (programId) {
      const { rows } = await this.db.query<EventRow>(
        "SELECT id, tenant_id, program_id, name, description, type, status, start_at, end_at, location, virtual_url, capacity, created_at, updated_at FROM events WHERE program_id = $1 ORDER BY start_at DESC NULLS LAST, created_at DESC",
        [programId]
      );
      return rows;
    }
    const { rows } = await this.db.query<EventRow>(
      "SELECT id, tenant_id, program_id, name, description, type, status, start_at, end_at, location, virtual_url, capacity, created_at, updated_at FROM events ORDER BY start_at DESC NULLS LAST, created_at DESC"
    );
    return rows;
  }

  async get(id: string) {
    const { rows } = await this.db.query<EventRow>(
      "SELECT id, tenant_id, program_id, name, description, type, status, start_at, end_at, location, virtual_url, capacity, created_at, updated_at FROM events WHERE id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async create(input: {
    tenant_id?: string | null;
    program_id: string;
    name: string;
    description?: string | null;
    type: string;
    status?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    location?: string | null;
    virtual_url?: string | null;
    capacity?: number | null;
  }) {
    const tenantId = this.resolveTenantId(input.tenant_id);
    const { rows } = await this.db.query<EventRow>(
      "INSERT INTO events (tenant_id, program_id, name, description, type, status, start_at, end_at, location, virtual_url, capacity) VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'draft')::event_status, $7, $8, $9, $10, $11) RETURNING id, tenant_id, program_id, name, description, type, status, start_at, end_at, location, virtual_url, capacity, created_at, updated_at",
      [
        tenantId,
        input.program_id,
        input.name,
        input.description ?? null,
        input.type,
        input.status ?? null,
        input.start_at ?? null,
        input.end_at ?? null,
        input.location ?? null,
        input.virtual_url ?? null,
        input.capacity ?? null
      ]
    );
    return rows[0];
  }

  async update(id: string, input: {
    name?: string | null;
    description?: string | null;
    type?: string | null;
    status?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    location?: string | null;
    virtual_url?: string | null;
    capacity?: number | null;
  }) {
    const { rows } = await this.db.query<EventRow>(
      "UPDATE events SET name = COALESCE($2, name), description = COALESCE($3, description), type = COALESCE($4, type), status = COALESCE($5::event_status, status), start_at = COALESCE($6, start_at), end_at = COALESCE($7, end_at), location = COALESCE($8, location), virtual_url = COALESCE($9, virtual_url), capacity = COALESCE($10, capacity), updated_at = now() WHERE id = $1 RETURNING id, tenant_id, program_id, name, description, type, status, start_at, end_at, location, virtual_url, capacity, created_at, updated_at",
      [
        id,
        input.name ?? null,
        input.description ?? null,
        input.type ?? null,
        input.status ?? null,
        input.start_at ?? null,
        input.end_at ?? null,
        input.location ?? null,
        input.virtual_url ?? null,
        input.capacity ?? null
      ]
    );
    return rows[0] ?? null;
  }

  async listSessions(eventId: string) {
    const { rows } = await this.db.query<EventSessionRow>(
      "SELECT id, tenant_id, event_id, name, start_at, end_at, created_at, updated_at FROM event_sessions WHERE event_id = $1 ORDER BY start_at ASC NULLS LAST",
      [eventId]
    );
    return rows;
  }

  async createSession(eventId: string, input: { name: string; start_at?: string | null; end_at?: string | null }) {
    const tenantId = this.resolveTenantId();
    const { rows } = await this.db.query<EventSessionRow>(
      "INSERT INTO event_sessions (tenant_id, event_id, name, start_at, end_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, tenant_id, event_id, name, start_at, end_at, created_at, updated_at",
      [tenantId, eventId, input.name, input.start_at ?? null, input.end_at ?? null]
    );
    return rows[0];
  }

  async createRegistration(eventId: string, input: { profile_id: string; status?: string | null }) {
    const tenantId = this.resolveTenantId();
    const { rows } = await this.db.query(
      "INSERT INTO event_registrations (tenant_id, event_id, profile_id, status) VALUES ($1, $2, $3, COALESCE($4, 'registered')::registration_status) RETURNING id, event_id, profile_id, status, registered_at",
      [tenantId, eventId, input.profile_id, input.status ?? null]
    );
    return rows[0];
  }

  async createAttendance(eventId: string, input: { event_session_id: string; profile_id: string; checked_in_at?: string | null }) {
    const tenantId = this.resolveTenantId();
    const { rows } = await this.db.query(
      "INSERT INTO event_attendance (tenant_id, event_session_id, profile_id, checked_in_at) VALUES ($1, $2, $3, $4) ON CONFLICT (event_session_id, profile_id) DO UPDATE SET checked_in_at = EXCLUDED.checked_in_at RETURNING id, event_session_id, profile_id, checked_in_at",
      [tenantId, input.event_session_id, input.profile_id, input.checked_in_at ?? null]
    );
    return rows[0];
  }

  async createFeedback(eventId: string, input: { profile_id: string; score?: number | null; comments?: string | null }) {
    const tenantId = this.resolveTenantId();
    const { rows } = await this.db.query(
      "INSERT INTO event_feedback (tenant_id, event_id, profile_id, score, comments) VALUES ($1, $2, $3, $4, $5) RETURNING id, event_id, profile_id, score, comments",
      [tenantId, eventId, input.profile_id, input.score ?? null, input.comments ?? null]
    );
    return rows[0];
  }
}
