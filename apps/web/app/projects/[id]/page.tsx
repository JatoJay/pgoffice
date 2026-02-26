import Link from "next/link";
import { Header } from "../../ui/header";
import { api } from "../../lib/api";

type Project = {
  id: string;
  name: string;
  status?: string | null;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  created_at: string;
};

async function getProject(id: string) {
  return api.get<{ item: Project }>(`/api/v1/projects/${id}`);
}

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const { data, error } = await getProject(id);
  const project = data?.item;

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Project</p>
            <h1>{project?.name ?? "Project detail"}</h1>
            <p className="lede">View project details and milestones.</p>
          </div>
          <Link href="/projects" className="action secondary">
            Back to Projects
          </Link>
        </div>

        {error ? <div className="empty">{error}</div> : null}

        {project && (
          <section className="detail-grid">
            <div className="detail-card">
              <h3>Project Information</h3>
              <dl style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.5rem" }}>
                <dt><strong>Status</strong></dt>
                <dd><span className={`status-badge ${project.status}`}>{project.status ?? "draft"}</span></dd>
                <dt><strong>Description</strong></dt>
                <dd>{project.description || "No description"}</dd>
                <dt><strong>Start Date</strong></dt>
                <dd>{project.start_at ? new Date(project.start_at).toLocaleDateString() : "Not set"}</dd>
                <dt><strong>End Date</strong></dt>
                <dd>{project.end_at ? new Date(project.end_at).toLocaleDateString() : "Not set"}</dd>
                <dt><strong>Created</strong></dt>
                <dd>{new Date(project.created_at).toLocaleDateString()}</dd>
              </dl>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
