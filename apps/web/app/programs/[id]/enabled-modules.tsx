"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateEventForm, CreateProjectForm, CreateBudgetForm, CreateSurveyForm } from "./module-forms";

type EnabledModulesProps = {
  programId: string;
  enabledModuleKeys: string[];
  events: Record<string, unknown>[];
  projects: Record<string, unknown>[];
  budgets: Record<string, unknown>[];
  surveys: Record<string, unknown>[];
};

export function EnabledModules({ programId, enabledModuleKeys, events, projects, budgets, surveys }: EnabledModulesProps) {
  const router = useRouter();
  const enabledSet = new Set(enabledModuleKeys);
  const isModuleEnabled = (key: string) => enabledSet.has(key);

  const handleSuccess = () => {
    router.refresh();
  };

  const hasEnabledModules = isModuleEnabled("events") || isModuleEnabled("projects_tasks") || isModuleEnabled("budgeting") || isModuleEnabled("surveys");

  if (!hasEnabledModules) return null;

  return (
    <>
      <h2 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Enabled Modules</h2>
      <section className="detail-grid">
        {isModuleEnabled("events") && (
          <div className="detail-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Events</h3>
              <Link href={`/events/list?program_id=${programId}`} className="action ghost sm">View all</Link>
            </div>
            {events.length === 0 ? (
              <p className="empty">No events for this program yet.</p>
            ) : (
              <div className="list-grid">
                {events.slice(0, 3).map((event, index) => (
                  <Link key={(event.id as string) ?? index} href={`/events/${event.id}`} className="list-card">
                    <strong>{(event.name as string) ?? "Event"}</strong>
                    <span className={`status-badge ${event.status}`}>{(event.status as string) ?? "draft"}</span>
                    <em>{(event.type as string) || "Event"}</em>
                  </Link>
                ))}
              </div>
            )}
            <div style={{ marginTop: "1rem" }}>
              <CreateEventForm programId={programId} onSuccess={handleSuccess} />
            </div>
          </div>
        )}

        {isModuleEnabled("projects_tasks") && (
          <div className="detail-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Projects</h3>
              <Link href={`/projects/list?program_id=${programId}`} className="action ghost sm">View all</Link>
            </div>
            {projects.length === 0 ? (
              <p className="empty">No projects for this program yet.</p>
            ) : (
              <div className="list-grid">
                {projects.slice(0, 3).map((project, index) => (
                  <Link key={(project.id as string) ?? index} href={`/projects/${project.id}`} className="list-card">
                    <strong>{(project.name as string) ?? "Project"}</strong>
                    <span className={`status-badge ${project.status}`}>{(project.status as string) ?? "draft"}</span>
                  </Link>
                ))}
              </div>
            )}
            <div style={{ marginTop: "1rem" }}>
              <CreateProjectForm programId={programId} onSuccess={handleSuccess} />
            </div>
          </div>
        )}

        {isModuleEnabled("budgeting") && (
          <div className="detail-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Budgets</h3>
              <Link href={`/budgets/list?program_id=${programId}`} className="action ghost sm">View all</Link>
            </div>
            {budgets.length === 0 ? (
              <p className="empty">No budgets for this program yet.</p>
            ) : (
              <div className="list-grid">
                {budgets.slice(0, 3).map((budget, index) => (
                  <Link key={(budget.id as string) ?? index} href={`/budgets/${budget.id}`} className="list-card">
                    <strong>{(budget.name as string) ?? "Budget"}</strong>
                    <span className={`status-badge ${budget.status}`}>{(budget.status as string) ?? "draft"}</span>
                    <em>{(budget.total_amount as number) != null ? `$${(budget.total_amount as number).toLocaleString()}` : "No amount"}</em>
                  </Link>
                ))}
              </div>
            )}
            <div style={{ marginTop: "1rem" }}>
              <CreateBudgetForm programId={programId} onSuccess={handleSuccess} />
            </div>
          </div>
        )}

        {isModuleEnabled("surveys") && (
          <div className="detail-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Surveys</h3>
              <Link href={`/surveys/list?program_id=${programId}`} className="action ghost sm">View all</Link>
            </div>
            {surveys.length === 0 ? (
              <p className="empty">No surveys for this program yet.</p>
            ) : (
              <div className="list-grid">
                {surveys.slice(0, 3).map((survey, index) => (
                  <Link key={(survey.id as string) ?? index} href={`/surveys/${survey.id}`} className="list-card">
                    <strong>{(survey.name as string) ?? "Survey"}</strong>
                    <span className={`status-badge ${survey.status}`}>{(survey.status as string) ?? "draft"}</span>
                    <em>{(survey.description as string) || "No description"}</em>
                  </Link>
                ))}
              </div>
            )}
            <div style={{ marginTop: "1rem" }}>
              <CreateSurveyForm programId={programId} onSuccess={handleSuccess} />
            </div>
          </div>
        )}
      </section>
    </>
  );
}
