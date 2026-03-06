"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

type DocumentsListProps = {
  documents: Document[];
  projectId: string;
  tenantId: string;
};

export function DocumentsList({ documents: initialDocs, projectId, tenantId }: DocumentsListProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocs);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/v1/documents/${docId}`, {
        method: "DELETE",
        headers: {
          "x-tenant-id": tenantId,
          "x-super-admin": "true"
        }
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to delete: ${res.status}`);
      }

      setDocuments(documents.filter(d => d.id !== docId));
      setSuccess("Document deleted");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProjectSummary = async () => {
    setGeneratingSummary(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/v1/documents/generate/project/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-super-admin": "true"
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to generate: ${res.status}`);
      }

      const { document } = await res.json();
      setDocuments([document, ...documents]);
      setSuccess("Project summary generated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("project_id", projectId);

      const res = await fetch(`${apiUrl}/api/v1/documents/upload`, {
        method: "POST",
        headers: {
          "x-tenant-id": tenantId,
          "x-super-admin": "true"
        },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to upload: ${res.status}`);
      }

      const { document } = await res.json();
      setDocuments([document, ...documents]);
      setSuccess("Document uploaded successfully");
      setTimeout(() => setSuccess(null), 3000);
      router.push(`/projects/${projectId}/documents/${document.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const statusColors: Record<string, { bg: string; color: string; border: string }> = {
    draft: { bg: "rgba(156, 163, 175, 0.15)", color: "#9ca3af", border: "rgba(156, 163, 175, 0.3)" },
    published: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e", border: "rgba(34, 197, 94, 0.3)" },
    archived: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "rgba(239, 68, 68, 0.3)" }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            color: "#9ca3af",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            cursor: uploading ? "wait" : "pointer",
            fontWeight: 500,
            fontSize: "0.875rem"
          }}
        >
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.odt,.ods,.odp,.txt,.rtf,.csv"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <button
          onClick={handleGenerateProjectSummary}
          disabled={generatingSummary}
          style={{
            padding: "0.75rem 1.5rem",
            background: generatingSummary ? "rgba(34, 197, 94, 0.5)" : "#22c55e",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: generatingSummary ? "wait" : "pointer",
            fontWeight: 500,
            fontSize: "0.875rem"
          }}
        >
          {generatingSummary ? "Generating..." : "Generate Project Summary"}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
          {success}
        </div>
      )}

      {documents.length === 0 ? (
        <section className="detail-card">
          <p style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>
            No documents yet. Upload a document, generate a project summary, or create documents from tasks.
          </p>
        </section>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {documents.map(doc => {
            const colors = statusColors[doc.status] || statusColors.draft;
            return (
              <section key={doc.id} className="detail-card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                      <Link
                        href={`/projects/${projectId}/documents/${doc.id}`}
                        style={{ color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: "1.125rem" }}
                      >
                        {doc.title}
                      </Link>
                      {doc.file_path && (
                        <span style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "0.125rem 0.5rem", borderRadius: "4px", fontSize: "0.625rem", fontWeight: 600 }}>
                          FILE
                        </span>
                      )}
                      {doc.ai_generated && (
                        <span style={{ background: "#22c55e", color: "#fff", padding: "0.125rem 0.5rem", borderRadius: "4px", fontSize: "0.625rem", fontWeight: 600 }}>
                          AI
                        </span>
                      )}
                      <span style={{
                        background: colors.bg,
                        color: colors.color,
                        border: `1px solid ${colors.border}`,
                        padding: "0.125rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        textTransform: "capitalize"
                      }}>
                        {doc.status}
                      </span>
                    </div>
                    <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                      {doc.file_name ? (
                        <span>{doc.file_name} {doc.file_size ? `(${formatFileSize(doc.file_size)})` : ""}</span>
                      ) : (
                        <span>{doc.content.substring(0, 150)}...</span>
                      )}
                    </p>
                    <p style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      Version {doc.version} • Updated {formatDate(doc.updated_at)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginLeft: "1rem" }}>
                    <Link
                      href={`/projects/${projectId}/documents/${doc.id}`}
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
                      {doc.file_path ? "Open" : "Edit"}
                    </Link>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={loading}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "transparent",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "6px",
                        cursor: loading ? "wait" : "pointer",
                        fontSize: "0.875rem"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
