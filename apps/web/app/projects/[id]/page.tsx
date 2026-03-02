import Link from "next/link";
import { cookies } from "next/headers";
import { Header } from "../../ui/header";
import { TaskList } from "./task-list";
import { BudgetTable } from "./budget-table";

type Task = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: number;
  due_at: string | null;
  estimated_cost: number | null;
  assigned_email: string | null;
  order_index: number;
};

type BudgetItem = {
  id: string;
  category: string;
  description: string | null;
  estimated_amount: number;
  actual_amount: number | null;
  order_index: number;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  total_budget: number | null;
  currency: string;
  ai_generated: boolean;
  status: string;
  start_at: string | null;
  end_at: string | null;
  instance_id: string | null;
  created_at: string;
};

type ProjectData = {
  project: Project;
  tasks: Task[];
  budget_items: BudgetItem[];
};

async function getProjectData(id: string, tenantId: string): Promise<{ data: ProjectData | null; error: string | null }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  try {
    const [projectRes, tasksRes, budgetRes] = await Promise.all([
      fetch(`${apiUrl}/api/v1/ai-projects/${id}`, {
        headers: { "x-tenant-id": tenantId, "x-super-admin": "true" },
        cache: "no-store"
      }),
      fetch(`${apiUrl}/api/v1/ai-projects/${id}/tasks`, {
        headers: { "x-tenant-id": tenantId, "x-super-admin": "true" },
        cache: "no-store"
      }),
      fetch(`${apiUrl}/api/v1/ai-projects/${id}/budget-items`, {
        headers: { "x-tenant-id": tenantId, "x-super-admin": "true" },
        cache: "no-store"
      })
    ]);

    if (!projectRes.ok) {
      return { data: null, error: `Failed to fetch project: ${projectRes.status}` };
    }

    const project = await projectRes.json();
    const tasks = tasksRes.ok ? await tasksRes.json() : { items: [] };
    const budget = budgetRes.ok ? await budgetRes.json() : { items: [] };

    return {
      data: {
        project: project.project || project,
        tasks: tasks.items || tasks.tasks || [],
        budget_items: budget.items || budget.budget_items || []
      },
      error: null
    };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to fetch project" };
  }
}

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("pgm_tenant")?.value || "";

  const { data, error } = await getProjectData(id, tenantId);
  const project = data?.project;
  const tasks = data?.tasks || [];
  const budgetItems = data?.budget_items || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: project?.currency || "USD"
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const totalEstimatedCost = tasks.reduce((sum, t) => sum + (t.estimated_cost || 0), 0);
  const totalBudget = budgetItems.reduce((sum, b) => sum + b.estimated_amount, 0);

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              {project?.instance_id && (
                <>
                  <Link href={`/instances/${project.instance_id}/projects`} style={{ color: "inherit", textDecoration: "none" }}>
                    Projects
                  </Link>
                  {" / "}
                </>
              )}
              Project
            </p>
            <h1>{project?.name ?? "Project detail"}</h1>
            <p className="lede">
              {project?.location && `${project.location} • `}
              {project?.start_at && project?.end_at && `${formatDate(project.start_at)} - ${formatDate(project.end_at)}`}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {project?.ai_generated && (
              <span style={{ background: "#dcfce7", color: "#166534", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.875rem" }}>
                AI Generated
              </span>
            )}
            <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.875rem", textTransform: "capitalize" }}>
              {project?.status || "draft"}
            </span>
          </div>
        </div>

        {error ? <div className="empty">{error}</div> : null}

        {project && (
          <>
            <section className="detail-card" style={{ marginBottom: "1.5rem" }}>
              <h3>Overview</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
                <div>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Total Budget</p>
                  <strong style={{ fontSize: "1.5rem", color: "#4f46e5" }}>{formatCurrency(project.total_budget || totalBudget)}</strong>
                </div>
                <div>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Estimated Task Costs</p>
                  <strong style={{ fontSize: "1.5rem" }}>{formatCurrency(totalEstimatedCost)}</strong>
                </div>
                <div>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Tasks</p>
                  <strong style={{ fontSize: "1.5rem" }}>{tasks.length}</strong>
                </div>
                <div>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Budget Categories</p>
                  <strong style={{ fontSize: "1.5rem" }}>{budgetItems.length}</strong>
                </div>
              </div>
              {project.description && (
                <p style={{ marginTop: "1.5rem", color: "#374151" }}>{project.description}</p>
              )}
            </section>

            <TaskList tasks={tasks} projectId={id} tenantId={tenantId} formatCurrency={formatCurrency} />

            <BudgetTable budgetItems={budgetItems} formatCurrency={formatCurrency} totalBudget={project.total_budget || totalBudget} />
          </>
        )}
      </main>
    </div>
  );
}
