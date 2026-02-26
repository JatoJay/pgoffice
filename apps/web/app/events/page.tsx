import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Header } from "../ui/header";
import { api } from "../lib/api";
import { getEvents, getPrograms } from "../lib/queries";
import { resolveActiveTenantId } from "../lib/tenant";

export default async function EventsPage() {
  const [{ data, error }, { data: programData }] = await Promise.all([getEvents(), getPrograms()]);
  const programs = programData?.items ?? [];
  const hasPrograms = programs.length > 0;

  async function createEvent(formData: FormData) {
    "use server";
    const tenantId = await resolveActiveTenantId();

    const programId = String(formData.get("program_id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const type = String(formData.get("type") ?? "webinar").trim() || "webinar";
    const description = String(formData.get("description") ?? "").trim();
    const startAt = String(formData.get("start_at") ?? "").trim();
    const endAt = String(formData.get("end_at") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const virtualUrl = String(formData.get("virtual_url") ?? "").trim();
    const capacityRaw = String(formData.get("capacity") ?? "").trim();
    const capacity = capacityRaw ? Number(capacityRaw) : undefined;

    if (!programId || !name) {
      throw new Error("Program and event name are required");
    }

    const { error } = await api.post<{ item: unknown }>("/api/v1/events", {
      tenant_id: tenantId,
      program_id: programId,
      name,
      type,
      description: description || undefined,
      start_at: startAt || undefined,
      end_at: endAt || undefined,
      location: location || undefined,
      virtual_url: virtualUrl || undefined,
      capacity: Number.isFinite(capacity) ? capacity : undefined
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath("/events");
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Events</p>
            <h1>Event Series</h1>
            <p className="lede">Coordinate gatherings and capture feedback.</p>
          </div>
          <a className="action primary" href="#create-event">
            Create event
          </a>
        </div>

        <section className="detail-card">
          <h3 id="create-event">New event</h3>
          <form action={createEvent} className="form">
            <div className="form-grid">
              <label>
                Program
                <select name="program_id" required disabled={!hasPrograms}>
                  {hasPrograms ? (
                    programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Create a program first</option>
                  )}
                </select>
              </label>
              <label>
                Event name
                <input name="name" placeholder="Founder Summit" required />
              </label>
              <label>
                Type
                <select name="type">
                  <option value="webinar">Webinar</option>
                  <option value="workshop">Workshop</option>
                  <option value="salon">Salon</option>
                  <option value="concert">Concert</option>
                  <option value="conference">Conference</option>
                  <option value="meetup">Meetup</option>
                </select>
              </label>
              <label>
                Start
                <input type="datetime-local" name="start_at" />
              </label>
              <label>
                End
                <input type="datetime-local" name="end_at" />
              </label>
              <label>
                Location
                <input name="location" placeholder="Brooklyn, NY" />
              </label>
              <label>
                Virtual URL
                <input name="virtual_url" placeholder="https://" />
              </label>
              <label>
                Capacity
                <input type="number" name="capacity" min="1" />
              </label>
              <label>
                Description
                <textarea name="description" rows={3} placeholder="Optional details" />
              </label>
            </div>
            <button className="action primary" type="submit" disabled={!hasPrograms}>
              Create event
            </button>
          </form>
          {!hasPrograms ? (
            <div className="empty">Create a program before scheduling events.</div>
          ) : null}
        </section>

        {error ? <div className="empty">{error}</div> : null}
        {!error && (!data?.items || data.items.length === 0) ? (
          <div className="empty">No events yet. Start by adding your first session.</div>
        ) : null}

        {data?.items && data.items.length > 0 && (
          <section className="detail-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Recent Events</h3>
              <Link href="/events/list" className="action secondary">
                View all ({data.items.length})
              </Link>
            </div>
            <div className="list-grid">
              {data.items.slice(0, 3).map((event, index) => (
                <Link key={event.id ?? index} href={`/events/${event.id}`} className="list-card">
                  <strong>{event.name ?? "Event"}</strong>
                  <span className={`status-badge ${event.status}`}>{event.status ?? "draft"}</span>
                  <em>{event.type || "Event"}</em>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
