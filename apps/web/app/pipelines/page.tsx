import { revalidatePath } from "next/cache";
import { Header } from "../ui/header";
import { api } from "../lib/api";
import { getPipelines, getPrograms } from "../lib/queries";
import { resolveActiveTenantId } from "../lib/tenant";

export default async function PipelinesPage() {
  const [{ data, error }, { data: programData }] = await Promise.all([getPipelines(), getPrograms()]);
  const programs = programData?.items ?? [];
  const hasPrograms = programs.length > 0;

  async function createPipeline(formData: FormData) {
    "use server";
    const tenantId = await resolveActiveTenantId();

    const programId = String(formData.get("program_id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();

    if (!programId || !name) {
      throw new Error("Program and pipeline name are required");
    }

    const { error } = await api.post<{ item: unknown }>("/api/v1/pipelines", {
      tenant_id: tenantId,
      program_id: programId,
      name
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath("/pipelines");
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Pipeline</p>
            <h1>Opportunities</h1>
            <p className="lede">Track commitments, partnerships, and outcomes.</p>
          </div>
          <a className="action primary" href="#create-pipeline">
            New opportunity
          </a>
        </div>

        <section className="detail-card">
          <h3 id="create-pipeline">New pipeline</h3>
          <form action={createPipeline} className="form">
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
                Pipeline name
                <input name="name" placeholder="Investment pipeline" required />
              </label>
            </div>
            <button className="action primary" type="submit" disabled={!hasPrograms}>
              Create pipeline
            </button>
          </form>
          {!hasPrograms ? (
            <div className="empty">Create a program before tracking pipeline items.</div>
          ) : null}
        </section>

        {error ? <div className="empty">{error}</div> : null}
        {!error && (!data?.items || data.items.length === 0) ? (
          <div className="empty">No pipeline items yet. Capture new opportunities.</div>
        ) : null}

        <div className="list-grid">
          {data?.items?.map((pipeline, index) => (
            <div key={index} className="list-card">
              <strong>{String(pipeline.name ?? "Pipeline")}</strong>
              <span>Stages: {String(pipeline.stage_count ?? "TBD")}</span>
              <em>Updated recently</em>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
