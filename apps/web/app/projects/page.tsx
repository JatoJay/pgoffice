import Link from "next/link";
import { cookies } from "next/headers";
import { Header } from "../ui/header";

type AIProject = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  status: string;
  total_budget: number | null;
  currency: string;
  ai_generated: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
};

async function getAIProjects(tenantId: string): Promise<{ items: AIProject[]; error: string | null }> {
  if (!tenantId) {
    return { items: [], error: null };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/api/v1/ai-projects/instances/${tenantId}/projects`, {
      headers: { "x-tenant-id": tenantId, "x-super-admin": "true" },
      cache: "no-store"
    });

    if (!res.ok) {
      return { items: [], error: `Failed to fetch projects: ${res.status}` };
    }

    const data = await res.json();
    return { items: data.items || [], error: null };
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : "Failed to fetch projects" };
  }
}

export default async function ProjectsPage() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("pgm_tenant")?.value || "";
  const { items: projects, error } = await getAIProjects(tenantId);

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    draft: { bg: "rgba(156, 163, 175, 0.2)", color: "#9ca3af" },
    active: { bg: "rgba(34, 197, 94, 0.2)", color: "#22c55e" },
    completed: { bg: "rgba(59, 130, 246, 0.2)", color: "#3b82f6" },
    archived: { bg: "rgba(107, 114, 128, 0.2)", color: "#6b7280" }
  };

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">AI Projects</p>
            <h1>Project Management</h1>
            <p className="lede">Create and manage AI-generated project plans with tasks and budgets.</p>
          </div>
          <Link className="action primary" href="/projects/new" style={{ background: "#22c55e", borderColor: "#22c55e" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            New AI Project
          </Link>
        </div>

        {!tenantId && (
          <div className="empty" style={{ background: "rgba(234, 179, 8, 0.1)", border: "1px solid rgba(234, 179, 8, 0.3)", color: "#eab308" }}>
            Please select an instance first to view and create projects.
          </div>
        )}

        {error && <div className="empty" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444" }}>{error}</div>}

        {tenantId && !error && projects.length === 0 && (
          <section className="detail-card" style={{ textAlign: "center", padding: "3rem" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" style={{ marginBottom: "1rem", opacity: 0.7 }}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>No projects yet</h3>
            <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>Create your first AI-powered project to get started with automated task planning and budget estimation.</p>
            <Link className="action primary" href="/projects/new" style={{ background: "#22c55e", borderColor: "#22c55e" }}>
              Create Your First Project
            </Link>
          </section>
        )}

        {projects.length > 0 && (
          <section className="detail-card">
            <h3 style={{ marginBottom: "1rem" }}>All Projects ({projects.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {projects.map((project) => {
                const statusStyle = statusColors[project.status] || statusColors.draft;
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    style={{
                      display: "block",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: "1.25rem",
                      background: "rgba(255, 255, 255, 0.03)",
                      textDecoration: "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <strong style={{ fontSize: "1.125rem", color: "#fff" }}>{project.name}</strong>
                        {project.ai_generated && (
                          <span style={{ background: "#22c55e", color: "#fff", padding: "0.125rem 0.5rem", borderRadius: "4px", fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase" }}>
                            AI
                          </span>
                        )}
                      </div>
                      <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: "0.25rem 0.75rem", borderRadius: "6px", fontSize: "0.75rem", textTransform: "capitalize", fontWeight: 500 }}>
                        {project.status}
                      </span>
                    </div>

                    {project.description && (
                      <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                        {project.description.length > 150 ? `${project.description.slice(0, 150)}...` : project.description}
                      </p>
                    )}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", fontSize: "0.875rem", color: "#9ca3af" }}>
                      {project.location && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {project.location}
                        </span>
                      )}
                      {project.start_at && project.end_at && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" />
                          </svg>
                          {formatDate(project.start_at)} - {formatDate(project.end_at)}
                        </span>
                      )}
                      {project.total_budget && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#22c55e", fontWeight: 500 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v12M8 10h8M8 14h8" />
                          </svg>
                          {formatCurrency(Number(project.total_budget), project.currency)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
