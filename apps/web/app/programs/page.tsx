import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Header } from "../ui/header";
import { api } from "../lib/api";
import { getPrograms } from "../lib/queries";
import { resolveActiveTenantId } from "../lib/tenant";

export default async function ProgramsPage() {
  const { data, error } = await getPrograms();

  async function createProgram(formData: FormData) {
    "use server";
    const tenantId = await resolveActiveTenantId();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!name) {
      throw new Error("Program name is required");
    }

    const { error } = await api.post<{ item: unknown }>("/api/v1/programs", {
      tenant_id: tenantId,
      name,
      description: description || undefined
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath("/programs");
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Programs</p>
            <h1>Programs & Journeys</h1>
            <p className="lede">
              Build program structures, phases, and cohorts. Activate modules by journey.
            </p>
          </div>
          <a className="action primary" href="#create-program">
            New program
          </a>
        </div>

        <section className="detail-card">
          <h3 id="create-program">Create program</h3>
          <form action={createProgram} className="form">
            <div className="form-grid">
              <label>
                Program name
                <input name="name" placeholder="Rhythms of Return" required />
              </label>
              <label>
                Description
                <textarea name="description" rows={3} placeholder="Optional summary" />
              </label>
            </div>
            <button className="action primary" type="submit">
              Create program
            </button>
          </form>
        </section>

        {error ? <div className="empty">{error}</div> : null}
        {!error && (!data?.items || data.items.length === 0) ? (
          <div className="empty">No programs yet. Start by creating your first program.</div>
        ) : null}

        {data?.items && data.items.length > 0 && (
          <section className="detail-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Recent Programs</h3>
              <Link href="/programs/list" className="action secondary">
                View all ({data.items.length})
              </Link>
            </div>
            <div className="list-grid">
              {data.items.slice(0, 3).map((program, index) => (
                <Link
                  key={program.id ?? index}
                  href={`/programs/${program.id ?? "new"}`}
                  className="list-card"
                >
                  <strong>{program.name ?? "Program"}</strong>
                  <span className={`status-badge ${program.status}`}>{program.status}</span>
                  <em>{program.description || "No description"}</em>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
