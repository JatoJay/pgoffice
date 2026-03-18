import Link from "next/link";
import { cookies } from "next/headers";
import { Header } from "../../../ui/header";
import { DocumentsList } from "./documents-list";

type Document = {
  id: string;
  title: string;
  content: string;
  content_type: string;
  status: string;
  version: number;
  ai_generated: boolean;
  task_id: string | null;
  created_at: string;
  updated_at: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
};

type Project = {
  id: string;
  name: string;
};

async function getDocumentsData(projectId: string, tenantId: string): Promise<{ project: Project | null; documents: Document[]; error: string | null }> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  try {
    const [projectRes, docsRes] = await Promise.all([
      fetch(`${apiUrl}/api/v1/ai-projects/${projectId}`, {
        headers: { "x-tenant-id": tenantId, "x-super-admin": "true" },
        cache: "no-store"
      }),
      fetch(`${apiUrl}/api/v1/documents/projects/${projectId}`, {
        headers: { "x-tenant-id": tenantId, "x-super-admin": "true" },
        cache: "no-store"
      })
    ]);

    const project = projectRes.ok ? (await projectRes.json()).project : null;
    const docs = docsRes.ok ? (await docsRes.json()).documents : [];

    return { project, documents: docs || [], error: null };
  } catch (e) {
    return { project: null, documents: [], error: e instanceof Error ? e.message : "Failed to fetch" };
  }
}

interface DocumentsPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("pgm_tenant")?.value || "";

  const { project, documents, error } = await getDocumentsData(id, tenantId);

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              <Link href="/projects" style={{ color: "inherit", textDecoration: "none" }}>Projects</Link>
              {" / "}
              <Link href={`/projects/${id}`} style={{ color: "inherit", textDecoration: "none" }}>{project?.name || "Project"}</Link>
              {" / "}
              Documents
            </p>
            <h1>Documents</h1>
            <p className="lede">AI-generated and custom project documents</p>
          </div>
        </div>

        {error && <div className="empty">{error}</div>}

        <DocumentsList documents={documents} projectId={id} tenantId={tenantId} />
      </main>
    </div>
  );
}
