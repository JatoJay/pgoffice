"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (id: string, config: object) => { destroyEditor: () => void };
    };
  }
}

type OnlyofficeEditorProps = {
  documentId: string;
  tenantId: string;
  apiUrl: string;
};

export function OnlyofficeEditor({ documentId, tenantId, apiUrl }: OnlyofficeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<{ destroyEditor: () => void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentServerUrl, setDocumentServerUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initEditor() {
      try {
        const res = await fetch(`${apiUrl}/api/v1/documents/${documentId}/editor-config`, {
          headers: {
            "x-tenant-id": tenantId,
            "x-super-admin": "true"
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch editor config");
        }

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (!mounted) return;

        setDocumentServerUrl(data.documentServerUrl);

        const script = document.createElement("script");
        script.src = `${data.documentServerUrl}/web-apps/apps/api/documents/api.js`;
        script.async = true;

        script.onload = () => {
          if (!mounted || !window.DocsAPI) {
            setError("ONLYOFFICE Document Server not available");
            setLoading(false);
            return;
          }

          try {
            editorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor", data.config);
            setLoading(false);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to initialize editor");
            setLoading(false);
          }
        };

        script.onerror = () => {
          if (!mounted) return;
          setError("Failed to load ONLYOFFICE Document Server. Make sure it's running on " + data.documentServerUrl);
          setLoading(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to initialize editor");
        setLoading(false);
      }
    }

    initEditor();

    return () => {
      mounted = false;
      if (editorRef.current) {
        try {
          editorRef.current.destroyEditor();
        } catch {
          // Ignore errors during cleanup
        }
      }
    };
  }, [documentId, tenantId, apiUrl]);

  if (error) {
    return (
      <div style={{
        padding: "2rem",
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "8px",
        color: "#f87171"
      }}>
        <h3 style={{ margin: "0 0 1rem 0" }}>Unable to load document editor</h3>
        <p style={{ margin: 0, color: "#9ca3af" }}>{error}</p>
        {documentServerUrl && (
          <p style={{ margin: "1rem 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
            Document Server URL: {documentServerUrl}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ height: "100%", minHeight: "600px", position: "relative" }}>
      {loading && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.5)"
        }}>
          <div style={{ color: "#9ca3af" }}>Loading document editor...</div>
        </div>
      )}
      <div
        id="onlyoffice-editor"
        ref={containerRef}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
