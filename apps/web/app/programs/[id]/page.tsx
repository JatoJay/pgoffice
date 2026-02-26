import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Header } from "../../ui/header";
import { api } from "../../lib/api";
import { getProgram } from "../../lib/queries";
import { EnabledModules } from "./enabled-modules";
import { PhaseCard } from "./phase-card";

type Phase = {
  id: string;
  name: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  order_index: number;
};

type Module = {
  module_key: string;
  is_enabled: boolean;
  name?: string | null;
  description?: string | null;
};

type AvailableModule = {
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
};

type Segment = {
  id: string;
  name: string;
  description?: string | null;
};

async function getProgramPhases(programId: string) {
  return api.get<{ items: Phase[] }>(`/api/v1/programs/${programId}/phases`);
}

async function getProgramModules(programId: string) {
  return api.get<{ items: Module[] }>(`/api/v1/programs/${programId}/modules`);
}

async function getAvailableModules() {
  return api.get<{ items: AvailableModule[] }>("/api/v1/modules");
}

async function getProgramSegments(programId: string) {
  return api.get<{ items: Segment[] }>(`/api/v1/programs/${programId}/segments`);
}

async function getProgramEvents(programId: string) {
  return api.get<{ items: Record<string, unknown>[] }>(`/api/v1/programs/${programId}/events`);
}

async function getProgramProjects(programId: string) {
  return api.get<{ items: Record<string, unknown>[] }>(`/api/v1/programs/${programId}/projects`);
}

async function getProgramBudgets(programId: string) {
  return api.get<{ items: Record<string, unknown>[] }>(`/api/v1/programs/${programId}/budgets`);
}

async function getProgramSurveys(programId: string) {
  return api.get<{ items: Record<string, unknown>[] }>(`/api/v1/programs/${programId}/surveys`);
}

interface ProgramPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProgramDetailPage({ params }: ProgramPageProps) {
  const { id } = await params;
  const [
    { data, error },
    { data: phasesData },
    { data: modulesData },
    { data: availableModulesData },
    { data: segmentsData },
    { data: eventsData },
    { data: projectsData },
    { data: budgetsData },
    { data: surveysData }
  ] = await Promise.all([
    getProgram(id),
    getProgramPhases(id),
    getProgramModules(id),
    getAvailableModules(),
    getProgramSegments(id),
    getProgramEvents(id),
    getProgramProjects(id),
    getProgramBudgets(id),
    getProgramSurveys(id)
  ]);

  const phases = phasesData?.items ?? [];
  const enabledModules = modulesData?.items ?? [];
  const availableModules = availableModulesData?.items ?? [];
  const segments = segmentsData?.items ?? [];
  const events = eventsData?.items ?? [];
  const projects = projectsData?.items ?? [];
  const budgets = budgetsData?.items ?? [];
  const surveys = surveysData?.items ?? [];

  const enabledModuleKeys = new Set(enabledModules.filter(m => m.is_enabled).map(m => m.module_key));

  async function createPhase(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const startAt = String(formData.get("start_at") ?? "").trim();
    const endAt = String(formData.get("end_at") ?? "").trim();

    if (!name) {
      throw new Error("Phase name is required");
    }

    const description = String(formData.get("description") ?? "").trim();

    const { error } = await api.post(`/api/v1/programs/${id}/phases`, {
      name,
      description: description || undefined,
      start_at: startAt || undefined,
      end_at: endAt || undefined
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath(`/programs/${id}`);
  }

  async function updatePhase(formData: FormData) {
    "use server";
    const phaseId = String(formData.get("phase_id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const startAt = String(formData.get("start_at") ?? "").trim();
    const endAt = String(formData.get("end_at") ?? "").trim();

    if (!phaseId) {
      throw new Error("Phase ID is required");
    }

    const { error } = await api.patch(`/api/v1/programs/${id}/phases/${phaseId}`, {
      name: name || undefined,
      description: description || undefined,
      start_at: startAt || undefined,
      end_at: endAt || undefined
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath(`/programs/${id}`);
  }

  async function deletePhase(formData: FormData) {
    "use server";
    const phaseId = String(formData.get("phase_id") ?? "").trim();

    if (!phaseId) {
      throw new Error("Phase ID is required");
    }

    const { error } = await api.delete(`/api/v1/programs/${id}/phases/${phaseId}`);

    if (error) {
      throw new Error(error);
    }

    revalidatePath(`/programs/${id}`);
  }

  async function toggleModule(formData: FormData) {
    "use server";
    const moduleKey = String(formData.get("module_key") ?? "").trim();
    const isEnabled = formData.get("is_enabled") === "true";

    if (!moduleKey) {
      throw new Error("Module key is required");
    }

    const { error } = await api.patch(`/api/v1/programs/${id}/modules`, {
      modules: [{ module_key: moduleKey, is_enabled: !isEnabled }]
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath(`/programs/${id}`);
  }

  async function createSegment(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!name) {
      throw new Error("Segment name is required");
    }

    const { error } = await api.post(`/api/v1/programs/${id}/segments`, {
      name,
      description: description || undefined
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath(`/programs/${id}`);
  }

  async function updateBudget(formData: FormData) {
    "use server";
    const totalBudget = parseFloat(String(formData.get("total_budget") ?? "0"));
    const currency = String(formData.get("currency") ?? "USD").trim();

    const { error } = await api.patch(`/api/v1/programs/${id}`, {
      total_budget: totalBudget,
      currency: currency || "USD"
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath(`/programs/${id}`);
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Program</p>
            <h1>{data?.item?.name ?? "Program detail"}</h1>
            <p className="lede">
              Manage program configuration and enabled modules.
            </p>
          </div>
          <Link href="/programs" className="action secondary">
            Back to Programs
          </Link>
        </div>

        {error ? <div className="empty">{error}</div> : null}

        <section className="detail-grid">
          <div className="detail-card">
            <h3>Phases</h3>
            <p>Configure phase timelines and key milestones.</p>

            {phases.length > 0 && (
              <div className="list-grid" style={{ marginBottom: "1rem" }}>
                {phases.map((phase) => (
                  <PhaseCard
                    key={phase.id}
                    phase={phase}
                    programId={id}
                    updateAction={updatePhase}
                    deleteAction={deletePhase}
                  />
                ))}
              </div>
            )}

            <details>
              <summary className="action ghost">Add phase</summary>
              <form action={createPhase} className="form" style={{ marginTop: "1rem" }}>
                <div className="form-grid">
                  <label>
                    Phase name
                    <input name="name" placeholder="Phase 1: Discovery" required />
                  </label>
                  <label>
                    Description
                    <textarea name="description" rows={2} placeholder="Optional description" />
                  </label>
                  <label>
                    Start date
                    <input type="date" name="start_at" />
                  </label>
                  <label>
                    End date
                    <input type="date" name="end_at" />
                  </label>
                </div>
                <button className="action primary" type="submit">
                  Create phase
                </button>
              </form>
            </details>
          </div>

          <div className="detail-card">
            <h3>Modules</h3>
            <p>Enable or disable modules for this program.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
              {availableModules.map((module) => {
                const isEnabled = enabledModuleKeys.has(module.key);
                return (
                  <form key={module.key} action={toggleModule} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <input type="hidden" name="module_key" value={module.key} />
                    <input type="hidden" name="is_enabled" value={String(isEnabled)} />
                    <button
                      type="submit"
                      className={`action ${isEnabled ? "primary" : "ghost"}`}
                      style={{ minWidth: "80px" }}
                    >
                      {isEnabled ? "Enabled" : "Enable"}
                    </button>
                    <div>
                      <strong>{module.name}</strong>
                      {module.description && (
                        <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.7 }}>
                          {module.description}
                        </p>
                      )}
                    </div>
                  </form>
                );
              })}
            </div>
          </div>

          <div className="detail-card">
            <h3>Budget</h3>
            <p>Track program budget and spending across tasks.</p>
            {(() => {
              const totalBudget = parseFloat(data?.item?.total_budget ?? "0");
              const spentBudget = parseFloat(data?.item?.spent_budget ?? "0");
              const currency = data?.item?.currency ?? "USD";
              const percentUsed = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;
              const progressColor = percentUsed >= 100 ? "#ef4444" : percentUsed >= 75 ? "#f59e0b" : "#22c55e";
              return (
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span>Spent: {currency} {spentBudget.toLocaleString()}</span>
                    <span>Total: {currency} {totalBudget.toLocaleString()}</span>
                  </div>
                  <div style={{ height: "8px", backgroundColor: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(percentUsed, 100)}%`, backgroundColor: progressColor, transition: "width 0.3s" }} />
                  </div>
                  <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", opacity: 0.7 }}>
                    {percentUsed.toFixed(1)}% of budget used
                  </p>
                </div>
              );
            })()}

            <details style={{ marginTop: "1rem" }}>
              <summary className="action ghost">Set budget</summary>
              <form action={updateBudget} className="form" style={{ marginTop: "1rem" }}>
                <div className="form-grid">
                  <label>
                    Total Budget
                    <input
                      type="number"
                      name="total_budget"
                      placeholder="10000.00"
                      step="0.01"
                      min="0"
                      defaultValue={data?.item?.total_budget ?? ""}
                      required
                    />
                  </label>
                  <label>
                    Currency
                    <select name="currency" defaultValue={data?.item?.currency ?? "USD"}>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="NGN">NGN</option>
                    </select>
                  </label>
                </div>
                <button className="action primary" type="submit">
                  Update budget
                </button>
              </form>
            </details>
          </div>

          <div className="detail-card">
            <h3>Segments</h3>
            <p>Define cohorts by region, role, or generation.</p>

            {segments.length > 0 && (
              <div className="list-grid" style={{ marginBottom: "1rem" }}>
                {segments.map((segment) => (
                  <div key={segment.id} className="list-card">
                    <strong>{segment.name}</strong>
                    <em>{segment.description || "No description"}</em>
                  </div>
                ))}
              </div>
            )}

            <details>
              <summary className="action ghost">Add segment</summary>
              <form action={createSegment} className="form" style={{ marginTop: "1rem" }}>
                <div className="form-grid">
                  <label>
                    Segment name
                    <input name="name" placeholder="East Coast Cohort" required />
                  </label>
                  <label>
                    Description
                    <textarea name="description" rows={2} placeholder="Optional description" />
                  </label>
                </div>
                <button className="action primary" type="submit">
                  Create segment
                </button>
              </form>
            </details>
          </div>
        </section>

        <EnabledModules
          programId={id}
          enabledModuleKeys={Array.from(enabledModuleKeys)}
          events={events}
          projects={projects}
          budgets={budgets}
          surveys={surveys}
        />
      </main>
    </div>
  );
}
