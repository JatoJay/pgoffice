import Link from "next/link";
import { cookies } from "next/headers";
import { Header } from "../../../../ui/header";
import { DocumentEditor } from "./document-editor";

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

type DocumentVersion = {
  id: string;
  version: number;
  title: string;
  content: string;
  changed_by: string | null;
  created_at: string;
};

async function getDocumentData(docId: string, tenantId: string): Promise<{ document: Document | null; versions: DocumentVersion[]; error: string | null }> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  try {
    const [docRes, versionsRes] = await Promise.all([
      fetch(`${apiUrl}/api/v1/documents/${docId}`, {
        headers: { "x-tenant-id": tenantId, "x-super-admin": "true" },
        cache: "no-store"
      }),
      fetch(`${apiUrl}/api/v1/documents/${docId}/versions`, {
        headers: { "x-tenant-id": tenantId, "x-super-admin": "true" },
        cache: "no-store"
      })
    ]);

    const doc = docRes.ok ? (await docRes.json()).document : null;
    const versions = versionsRes.ok ? (await versionsRes.json()).versions : [];

    return { document: doc, versions: versions || [], error: null };
  } catch (e) {
    return { document: null, versions: [], error: e instanceof Error ? e.message : "Failed to fetch" };
  }
}

interface DocumentPageProps {
  params: Promise<{ id: string; docId: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id: projectId, docId } = await params;
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("pgm_tenant")?.value || "";

  const { document, versions, error } = await getDocumentData(docId, tenantId);

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              <Link href="/projects" style={{ color: "inherit", textDecoration: "none" }}>Projects</Link>
              {" / "}
              <Link href={`/projects/${projectId}`} style={{ color: "inherit", textDecoration: "none" }}>Project</Link>
              {" / "}
              <Link href={`/projects/${projectId}/documents`} style={{ color: "inherit", textDecoration: "none" }}>Documents</Link>
              {" / "}
              Edit
            </p>
            <h1>{document?.title || "Document"}</h1>
            {document && (
              <p className="lede">
                Version {document.version} • {document.ai_generated ? "AI Generated" : "Manual"}
              </p>
            )}
          </div>
        </div>

        {error && <div className="empty">{error}</div>}

        {document && (
          <DocumentEditor document={document} versions={versions} projectId={projectId} tenantId={tenantId} />
        )}
      </main>
    </div>
  );
}
