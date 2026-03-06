"use client";

import { useState, useRef } from "react";
import { OnlyofficeEditor } from "./onlyoffice-editor";

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

type DocumentEditorProps = {
  document: Document;
  versions: DocumentVersion[];
  projectId: string;
  tenantId: string;
};

export function DocumentEditor({ document: initialDoc, versions, projectId, tenantId }: DocumentEditorProps) {
  const [doc, setDoc] = useState(initialDoc);
  const [title, setTitle] = useState(initialDoc.title);
  const [content, setContent] = useState(initialDoc.content);
  const [status, setStatus] = useState(initialDoc.status);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [editorMode, setEditorMode] = useState<"markdown" | "file">(initialDoc.file_path ? "file" : "markdown");
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
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/v1/documents/${doc.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-super-admin": "true"
        },
        body: JSON.stringify({ title, content, status })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to save: ${res.status}`);
      }

      const { document: updatedDoc } = await res.json();
      setDoc(updatedDoc);
      setSuccess("Document saved");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
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

      const res = await fetch(`${apiUrl}/api/v1/documents/${doc.id}/upload`, {
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

      const { document: updatedDoc } = await res.json();
      setDoc(updatedDoc);
      setTitle(updatedDoc.title);
      setEditorMode("file");
      setSuccess("File uploaded successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRestoreVersion = (version: DocumentVersion) => {
    setTitle(version.title);
    setContent(version.content);
    setSelectedVersion(null);
    setShowVersions(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    fontSize: "1rem",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#fff"
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: showVersions ? "1fr 300px" : "1fr", gap: "1.5rem" }}>
      <div>
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

        <section className="detail-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {editorMode === "markdown" && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: saving ? "rgba(34, 197, 94, 0.5)" : "#22c55e",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: saving ? "wait" : "pointer",
                    fontWeight: 500
                  }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "transparent",
                  color: "#9ca3af",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  cursor: uploading ? "wait" : "pointer"
                }}
              >
                {uploading ? "Uploading..." : "Upload File"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.odt,.ods,.odp,.txt,.rtf,.csv"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <button
                onClick={() => setShowVersions(!showVersions)}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: showVersions ? "rgba(255, 255, 255, 0.15)" : "transparent",
                  color: "#9ca3af",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                {versions.length} Version{versions.length !== 1 ? "s" : ""}
              </button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {doc.file_path && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setEditorMode("markdown")}
                    style={{
                      padding: "0.5rem 1rem",
                      background: editorMode === "markdown" ? "rgba(34, 197, 94, 0.15)" : "transparent",
                      color: editorMode === "markdown" ? "#22c55e" : "#9ca3af",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "6px 0 0 6px",
                      cursor: "pointer",
                      fontSize: "0.875rem"
                    }}
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => setEditorMode("file")}
                    style={{
                      padding: "0.5rem 1rem",
                      background: editorMode === "file" ? "rgba(34, 197, 94, 0.15)" : "transparent",
                      color: editorMode === "file" ? "#22c55e" : "#9ca3af",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "0 6px 6px 0",
                      cursor: "pointer",
                      fontSize: "0.875rem"
                    }}
                  >
                    Office Editor
                  </button>
                </div>
              )}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  padding: "0.5rem 1rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "6px",
                  fontSize: "0.875rem"
                }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {doc.file_path && editorMode === "file" && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px" }}>
              <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
                <strong style={{ color: "#fff" }}>{doc.file_name}</strong> ({formatFileSize(doc.file_size)})
              </p>
            </div>
          )}

          {editorMode === "markdown" ? (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Content (Markdown)</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={25}
                  style={{
                    ...inputStyle,
                    fontFamily: "monospace",
                    lineHeight: 1.6,
                    resize: "vertical"
                  }}
                />
              </div>
            </>
          ) : (
            <OnlyofficeEditor
              documentId={doc.id}
              tenantId={tenantId}
              apiUrl={apiUrl}
            />
          )}
        </section>
      </div>

      {showVersions && (
        <section className="detail-card" style={{ height: "fit-content", position: "sticky", top: "1rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Version History</h3>
          {versions.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No previous versions</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {versions.map(v => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVersion(selectedVersion?.id === v.id ? null : v)}
                  style={{
                    padding: "0.75rem",
                    background: selectedVersion?.id === v.id ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border: selectedVersion?.id === v.id ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid transparent"
                  }}
                >
                  <p style={{ color: "#fff", fontWeight: 500, fontSize: "0.875rem" }}>Version {v.version}</p>
                  <p style={{ color: "#6b7280", fontSize: "0.75rem" }}>{formatDate(v.created_at)}</p>
                  {selectedVersion?.id === v.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestoreVersion(v); }}
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.375rem 0.75rem",
                        background: "#22c55e",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        width: "100%"
                      }}
                    >
                      Restore this version
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
