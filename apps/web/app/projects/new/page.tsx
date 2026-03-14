"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateProject } from "@/app/actions/ai-projects";

type GeneratedTask = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: number;
  due_at: string | null;
  estimated_cost: number | null;
  order_index: number | null;
};

type GeneratedBudgetItem = {
  id: string;
  category: string;
  description: string | null;
  estimated_amount: number;
  order_index: number | null;
};

type GeneratedProject = {
  project: {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    total_budget: number | null;
    currency: string | null;
  };
  tasks: GeneratedTask[];
  budget_items: GeneratedBudgetItem[];
};

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "generating" | "review">("form");
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<GeneratedProject | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_at: "",
    end_at: "",
    location: ""
  });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFile(file);

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const text = await file.text();
      setFileContent(text);
    } else {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/parse-document", {
          method: "POST",
          body: formData
        });
        if (res.ok) {
          const { content } = await res.json();
          setFileContent(content);
        } else {
          setError("Failed to parse document");
          setAttachedFile(null);
        }
      } catch {
        setError("Failed to parse document");
        setAttachedFile(null);
      }
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep("generating");

    try {
      const tenantId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("pgm_tenant="))
        ?.split("=")[1];

      if (!tenantId) {
        throw new Error("No active instance selected. Please select an instance first.");
      }

      const fullDescription = fileContent
        ? `${formData.description}\n\n--- Attached Document Content ---\n${fileContent}`
        : formData.description;

      const data = await generateProject({
        instance_id: tenantId,
        name: formData.name,
        description: fullDescription,
        start_at: formData.start_at,
        end_at: formData.end_at,
        location: formData.location
      });

      setGeneratedData(data);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate project");
      setStep("form");
    }
  };

  const handleSave = () => {
    if (generatedData?.project?.id) {
      router.push(`/projects/${generatedData.project.id}`);
    }
  };

  const formatCurrency = (amount: number | null) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount ?? 0);
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    todo: { bg: "rgba(156, 163, 175, 0.2)", color: "#9ca3af" },
    pending: { bg: "rgba(234, 179, 8, 0.2)", color: "#eab308" },
    in_progress: { bg: "rgba(59, 130, 246, 0.2)", color: "#3b82f6" },
    done: { bg: "rgba(34, 197, 94, 0.2)", color: "#22c55e" },
    completed: { bg: "rgba(34, 197, 94, 0.2)", color: "#22c55e" }
  };

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            <Link href="/projects" style={{ color: "inherit", textDecoration: "none" }}>AI Projects</Link>
            {" / "}
            New
          </p>
          <h1>Create AI-Powered Project</h1>
          <p className="lede">
            Enter your project details and let AI generate tasks and budget estimates.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: "1rem", padding: "1rem", background: "rgba(239, 68, 68, 0.15)", borderRadius: "8px", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          {error}
        </div>
      )}

      {step === "form" && (
        <section className="detail-card">
          <h3 style={{ color: "#fff", marginBottom: "1rem" }}>Project Details</h3>
          <form onSubmit={handleGenerate} className="form">
            <div className="form-grid">
              <label>
                <span style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem", display: "block" }}>Project Name *</span>
                <input
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Annual Tech Summit 2025"
                  required
                  style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#fff", padding: "0.75rem", borderRadius: "8px", width: "100%" }}
                />
              </label>
              <label>
                <span style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem", display: "block" }}>Location *</span>
                <input
                  name="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Convention Center, New York"
                  required
                  style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#fff", padding: "0.75rem", borderRadius: "8px", width: "100%" }}
                />
              </label>
              <label>
                <span style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem", display: "block" }}>Start Date *</span>
                <input
                  type="date"
                  name="start_at"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  required
                  style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#fff", padding: "0.75rem", borderRadius: "8px", width: "100%" }}
                />
              </label>
              <label>
                <span style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem", display: "block" }}>End Date *</span>
                <input
                  type="date"
                  name="end_at"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  required
                  style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#fff", padding: "0.75rem", borderRadius: "8px", width: "100%" }}
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem", display: "block" }}>Description *</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Describe your project in detail. Include the type of event, expected attendees, key activities, and any special requirements..."
                  required
                  style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#fff", padding: "0.75rem", borderRadius: "8px", width: "100%", resize: "vertical" }}
                />
              </label>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem", display: "block" }}>Attach Document (Optional)</span>
                <div
                  style={{
                    border: "2px dashed rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "1.5rem",
                    textAlign: "center",
                    cursor: "pointer",
                    background: attachedFile ? "rgba(34, 197, 94, 0.1)" : "rgba(255, 255, 255, 0.02)",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  {attachedFile ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span style={{ color: "#22c55e", fontWeight: 500 }}>{attachedFile.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachedFile(null);
                          setFileContent("");
                        }}
                        style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: "0.25rem" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ marginBottom: "0.5rem" }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>Click to upload PDF, DOCX, or TXT</p>
                      <p style={{ color: "#6b7280", fontSize: "0.75rem", margin: "0.25rem 0 0" }}>AI will extract content to enhance task generation</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              className="action primary"
              type="submit"
              style={{ background: "#22c55e", borderColor: "#22c55e", marginTop: "1rem" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Generate with AI
            </button>
          </form>
        </section>
      )}

      {step === "generating" && (
        <section className="detail-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Generating Your Project Plan...</h3>
          <p style={{ color: "#9ca3af" }}>AI is creating tasks and budget estimates based on your requirements.</p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </section>
      )}

      {step === "review" && generatedData && (
        <>
          <section className="detail-card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ color: "#fff" }}>Generated Tasks ({generatedData.tasks.length})</h3>
              <span style={{ background: "#22c55e", color: "#fff", padding: "0.25rem 0.75rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>AI Generated</span>
            </div>
            <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>
              These tasks have been automatically generated based on your project description. You can edit them after saving.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {generatedData.tasks.map((task, index) => {
                const statusStyle = statusColors[task.status] || statusColors.todo;
                return (
                  <div
                    key={task.id || index}
                    style={{
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: "1rem",
                      background: "rgba(255, 255, 255, 0.03)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <strong style={{ color: "#fff" }}>{task.name}</strong>
                      <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: "0.125rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", textTransform: "capitalize" }}>
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                    <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.5rem", lineHeight: 1.5 }}>{task.description}</p>
                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: "#9ca3af" }}>
                      {task.due_at && <span>Due: {new Date(task.due_at).toLocaleDateString()}</span>}
                      {task.estimated_cost && <span style={{ color: "#22c55e" }}>Est: {formatCurrency(task.estimated_cost)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="detail-card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ color: "#fff" }}>Budget Breakdown</h3>
              <strong style={{ fontSize: "1.25rem", color: "#22c55e" }}>
                Total: {formatCurrency(generatedData.project.total_budget)}
              </strong>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#9ca3af", fontWeight: 600, fontSize: "0.875rem" }}>Category</th>
                    <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#9ca3af", fontWeight: 600, fontSize: "0.875rem" }}>Description</th>
                    <th style={{ textAlign: "right", padding: "0.75rem 0.5rem", color: "#9ca3af", fontWeight: 600, fontSize: "0.875rem" }}>Estimated</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedData.budget_items.map((item, index) => (
                    <tr key={item.id || index} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                      <td style={{ padding: "0.875rem 0.5rem", fontWeight: 500, color: "#fff" }}>{item.category}</td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "#9ca3af" }}>{item.description}</td>
                      <td style={{ padding: "0.875rem 0.5rem", textAlign: "right", color: "#fff" }}>{formatCurrency(item.estimated_amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <td colSpan={2} style={{ padding: "0.875rem 0.5rem", fontWeight: 600, color: "#fff" }}>Total</td>
                    <td style={{ padding: "0.875rem 0.5rem", textAlign: "right", fontWeight: 600, color: "#22c55e" }}>
                      {formatCurrency(generatedData.budget_items.reduce((sum, item) => sum + item.estimated_amount, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                setStep("form");
                setGeneratedData(null);
              }}
              style={{
                padding: "0.75rem 1.5rem",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#9ca3af",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500
              }}
            >
              Start Over
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500
              }}
            >
              View Project
            </button>
          </div>
        </>
      )}
    </main>
  );
}
