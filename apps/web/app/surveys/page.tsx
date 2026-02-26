import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Header } from "../ui/header";
import { api } from "../lib/api";
import { getPrograms, getSurveys } from "../lib/queries";
import { resolveActiveTenantId } from "../lib/tenant";

export default async function SurveysPage() {
  const [{ data, error }, { data: programData }] = await Promise.all([getSurveys(), getPrograms()]);
  const programs = programData?.items ?? [];
  const hasPrograms = programs.length > 0;

  async function createSurvey(formData: FormData) {
    "use server";
    const tenantId = await resolveActiveTenantId();

    const programId = String(formData.get("program_id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!programId || !name) {
      throw new Error("Program and survey name are required");
    }

    const { error } = await api.post<{ item: unknown }>("/api/v1/surveys", {
      tenant_id: tenantId,
      program_id: programId,
      name,
      description: description || undefined
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath("/surveys");
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Surveys</p>
            <h1>Feedback & Sentiment</h1>
            <p className="lede">Track qualitative change and sentiment.</p>
          </div>
          <a className="action primary" href="#create-survey">
            New survey
          </a>
        </div>

        <section className="detail-card">
          <h3 id="create-survey">New survey</h3>
          <form action={createSurvey} className="form">
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
                Survey name
                <input name="name" placeholder="Pre-program feedback" required />
              </label>
              <label>
                Description
                <textarea name="description" rows={3} placeholder="Optional summary" />
              </label>
            </div>
            <button className="action primary" type="submit" disabled={!hasPrograms}>
              Create survey
            </button>
          </form>
          {!hasPrograms ? (
            <div className="empty">Create a program before launching surveys.</div>
          ) : null}
        </section>

        {error ? <div className="empty">{error}</div> : null}
        {!error && (!data?.items || data.items.length === 0) ? (
          <div className="empty">No surveys yet. Create your first questionnaire.</div>
        ) : null}

        {data?.items && data.items.length > 0 && (
          <section className="detail-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Recent Surveys</h3>
              <Link href="/surveys/list" className="action secondary">
                View all ({data.items.length})
              </Link>
            </div>
            <div className="list-grid">
              {data.items.slice(0, 3).map((survey, index) => (
                <Link key={survey.id ?? index} href={`/surveys/${survey.id}`} className="list-card">
                  <strong>{survey.name ?? "Survey"}</strong>
                  <span className={`status-badge ${survey.status}`}>{survey.status ?? "draft"}</span>
                  <em>{survey.description || "No description"}</em>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
