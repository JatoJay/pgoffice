import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "../../../ui/header";

type Project = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  total_budget: number | null;
  ai_generated: boolean;
  status: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
};

type ProjectsResponse = {
  projects: Project[];
  instance: {
    id: string;
    name: string;
  };
};

async function getInstanceProjects(instanceId: string): Promise<{ data: ProjectsResponse | null; error: string | null }> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/api/v1/ai-projects/instances/${instanceId}/projects`, {
      headers: {
        "x-tenant-id": instanceId,
        "x-super-admin": "true"
      },
      cache: "no-store"
    });
    if (!res.ok) {
      return { data: null, error: `Failed to fetch projects: ${res.status}` };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to fetch projects" };
  }
}

async function getInstance(instanceId: string): Promise<{ name: string } | null> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/api/v1/instances/${instanceId}`, {
      headers: {
        "x-tenant-id": instanceId,
        "x-super-admin": "true"
      },
      cache: "no-store"
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function InstanceProjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: instanceId } = await params;

  const cookieStore = await cookies();
  cookieStore.set("pgm_tenant", instanceId, { path: "/", sameSite: "lax" });

  const [{ data, error }, instance] = await Promise.all([
    getInstanceProjects(instanceId),
    getInstance(instanceId)
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              <Link href="/instances" style={{ color: "inherit", textDecoration: "none" }}>
                Instances
              </Link>
              {" / "}
              {instance?.name || "Instance"}
            </p>
            <h1>Projects</h1>
            <p className="lede">Manage AI-generated projects for this instance.</p>
          </div>
          <Link href="/projects/new" className="action primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New AI Project
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!error && (!data?.projects || data.projects.length === 0) ? (
          <div className="empty">
            <p>No projects yet.</p>
            <p className="lede">Create your first AI-powered project to get started.</p>
            <Link href="/projects/new" className="action primary" style={{ marginTop: "1rem" }}>
              Create Project
            </Link>
          </div>
        ) : null}

        <div className="list-grid">
          {data?.projects?.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="list-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <strong>{project.name}</strong>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {project.ai_generated && (
                    <span
                      style={{
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "0.125rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem"
                      }}
                    >
                      AI Generated
                    </span>
                  )}
                  <span
                    style={{
                      background: "#e0e7ff",
                      color: "#3730a3",
                      padding: "0.125rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      textTransform: "capitalize"
                    }}
                  >
                    {project.status || "draft"}
                  </span>
                </div>
              </div>
              {project.description && (
                <em style={{ display: "block", marginTop: "0.5rem" }}>
                  {project.description.length > 100
                    ? `${project.description.substring(0, 100)}...`
                    : project.description}
                </em>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "0.75rem",
                  fontSize: "0.875rem",
                  color: "#6b7280"
                }}
              >
                {project.location && <span>{project.location}</span>}
                {project.total_budget && <span>{formatCurrency(project.total_budget)}</span>}
                {project.start_at && project.end_at && (
                  <span>
                    {formatDate(project.start_at)} - {formatDate(project.end_at)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
