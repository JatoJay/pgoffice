import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Header } from "../ui/header";
import { api } from "../lib/api";
import { getPrograms, getProjects } from "../lib/queries";
import { resolveActiveTenantId } from "../lib/tenant";

export default async function ProjectsPage() {
  const [{ data, error }, { data: programData }] = await Promise.all([getProjects(), getPrograms()]);
  const programs = programData?.items ?? [];
  const hasPrograms = programs.length > 0;

  async function createProject(formData: FormData) {
    "use server";
    const tenantId = await resolveActiveTenantId();

    const programId = String(formData.get("program_id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const startAt = String(formData.get("start_at") ?? "").trim();
    const endAt = String(formData.get("end_at") ?? "").trim();

    if (!programId || !name) {
      throw new Error("Program and project name are required");
    }

    const { error } = await api.post<{ item: unknown }>("/api/v1/projects", {
      tenant_id: tenantId,
      program_id: programId,
      name,
      description: description || undefined,
      start_at: startAt || undefined,
      end_at: endAt || undefined
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath("/projects");
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Projects</p>
            <h1>Project Management</h1>
            <p className="lede">Track initiatives and milestones within programs.</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link className="action primary" href="/projects/new">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Create with AI
            </Link>
            <a className="action secondary" href="#create-project">
              Manual
            </a>
          </div>
        </div>

        <section className="detail-card">
          <h3 id="create-project">New project</h3>
          <form action={createProject} className="form">
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
                Project name
                <input name="name" placeholder="Community Outreach" required />
              </label>
              <label>
                Start date
                <input type="date" name="start_at" />
              </label>
              <label>
                End date
                <input type="date" name="end_at" />
              </label>
              <label>
                Description
                <textarea name="description" rows={3} placeholder="Optional details" />
              </label>
            </div>
            <button className="action primary" type="submit" disabled={!hasPrograms}>
              Create project
            </button>
          </form>
          {!hasPrograms ? (
            <div className="empty">Create a program before starting projects.</div>
          ) : null}
        </section>

        {error ? <div className="empty">{error}</div> : null}
        {!error && (!data?.items || data.items.length === 0) ? (
          <div className="empty">No projects yet. Start by adding your first project.</div>
        ) : null}

        {data?.items && data.items.length > 0 && (
          <section className="detail-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Recent Projects</h3>
              <Link href="/projects/list" className="action secondary">
                View all ({data.items.length})
              </Link>
            </div>
            <div className="list-grid">
              {data.items.slice(0, 3).map((project: Record<string, unknown>, index: number) => (
                <Link key={(project.id as string) ?? index} href={`/projects/${project.id}`} className="list-card">
                  <strong>{(project.name as string) ?? "Project"}</strong>
                  <span className={`status-badge ${project.status}`}>{(project.status as string) ?? "draft"}</span>
                  <em>{(project.description as string) || "No description"}</em>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
