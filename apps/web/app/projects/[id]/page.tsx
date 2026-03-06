import Link from "next/link";
import { Header } from "../../ui/header";
import { TaskList } from "./task-list";
import { BudgetTable } from "./budget-table";
import { db } from "@/app/lib/supabase/db";

type Task = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: number;
  due_at: string | null;
  estimated_cost: number | null;
  assignee_email: string | null;
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
  tenant_id: string;
  created_at: string;
};

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const project = await db.projects.get(id);
  const tasks = project ? await db.tasks.list(id) : [];
  const budgetItems = project ? await db.budgetItems.list(id) : [];

  const currency = project?.currency || "USD";
  const formatCurrency = (amount: number) => {
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
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Link
              href={`/projects/${id}/documents`}
              style={{
                padding: "0.5rem 1rem",
                background: "transparent",
                color: "#9ca3af",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                fontSize: "0.875rem",
                textDecoration: "none"
              }}
            >
              Documents
            </Link>
            {project?.ai_generated && (
              <span style={{ background: "#22c55e", color: "#fff", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.875rem", fontWeight: 500 }}>
                AI Generated
              </span>
            )}
            <span style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.875rem", textTransform: "capitalize", fontWeight: 500, border: "1px solid rgba(34, 197, 94, 0.3)" }}>
              {project?.status || "draft"}
            </span>
          </div>
        </div>

        {!project && <div className="empty">Project not found</div>}

        {project && (
          <>
            <section className="detail-card" style={{ marginBottom: "1.5rem" }}>
              <h3>Overview</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
                <div>
                  <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Total Budget</p>
                  <strong style={{ fontSize: "1.75rem", color: "#22c55e" }}>{formatCurrency(project.total_budget || totalBudget)}</strong>
                </div>
                <div>
                  <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Estimated Task Costs</p>
                  <strong style={{ fontSize: "1.75rem", color: "#fff" }}>{formatCurrency(totalEstimatedCost)}</strong>
                </div>
                <div>
                  <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Tasks</p>
                  <strong style={{ fontSize: "1.75rem", color: "#fff" }}>{tasks.length}</strong>
                </div>
                <div>
                  <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Budget Categories</p>
                  <strong style={{ fontSize: "1.75rem", color: "#fff" }}>{budgetItems.length}</strong>
                </div>
              </div>
              {project.description && (
                <p style={{ marginTop: "1.5rem", color: "#d1d5db", lineHeight: 1.6 }}>{project.description}</p>
              )}
            </section>

            <TaskList tasks={tasks as Task[]} projectId={id} tenantId={project.tenant_id} currency={currency} />

            <BudgetTable budgetItems={budgetItems as BudgetItem[]} currency={currency} totalBudget={project.total_budget || totalBudget} projectId={id} tenantId={project.tenant_id} />
          </>
        )}
      </main>
    </div>
  );
}
