import Link from "next/link";
import { Header } from "../../ui/header";
import { api } from "../../lib/api";

type Event = {
  id: string;
  name: string;
  type?: string | null;
  status?: string | null;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  location?: string | null;
  virtual_url?: string | null;
  capacity?: number | null;
  created_at: string;
};

async function getEvent(id: string) {
  return api.get<{ item: Event }>(`/api/v1/events/${id}`);
}

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { id } = await params;
  const { data, error } = await getEvent(id);
  const event = data?.item;

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Event</p>
            <h1>{event?.name ?? "Event detail"}</h1>
            <p className="lede">View event details and manage registrations.</p>
          </div>
          <Link href="/events" className="action secondary">
            Back to Events
          </Link>
        </div>

        {error ? <div className="empty">{error}</div> : null}

        {event && (
          <section className="detail-grid">
            <div className="detail-card">
              <h3>Event Information</h3>
              <dl style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.5rem" }}>
                <dt><strong>Type</strong></dt>
                <dd>{event.type || "Not specified"}</dd>
                <dt><strong>Status</strong></dt>
                <dd><span className={`status-badge ${event.status}`}>{event.status ?? "draft"}</span></dd>
                <dt><strong>Description</strong></dt>
                <dd>{event.description || "No description"}</dd>
              </dl>
            </div>

            <div className="detail-card">
              <h3>Schedule</h3>
              <dl style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.5rem" }}>
                <dt><strong>Start</strong></dt>
                <dd>{event.start_at ? new Date(event.start_at).toLocaleString() : "Not set"}</dd>
                <dt><strong>End</strong></dt>
                <dd>{event.end_at ? new Date(event.end_at).toLocaleString() : "Not set"}</dd>
              </dl>
            </div>

            <div className="detail-card">
              <h3>Location</h3>
              <dl style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.5rem" }}>
                <dt><strong>Venue</strong></dt>
                <dd>{event.location || "Not specified"}</dd>
                <dt><strong>Virtual URL</strong></dt>
                <dd>{event.virtual_url ? <a href={event.virtual_url} target="_blank" rel="noreferrer">{event.virtual_url}</a> : "None"}</dd>
                <dt><strong>Capacity</strong></dt>
                <dd>{event.capacity ?? "Unlimited"}</dd>
              </dl>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
