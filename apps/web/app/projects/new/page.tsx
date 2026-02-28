"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../ui/header";

type GeneratedTask = {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: number;
  due_at: string | null;
  estimated_cost: number | null;
  order_index: number;
};

type GeneratedBudgetItem = {
  id: string;
  category: string;
  description: string;
  estimated_amount: number;
  order_index: number;
};

type GeneratedProject = {
  project: {
    id: string;
    name: string;
    description: string;
    location: string;
    total_budget: number;
    currency: string;
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/ai-projects/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenantId,
            "x-super-admin": "true"
          },
          body: JSON.stringify({
            instance_id: tenantId,
            name: formData.name,
            description: formData.description,
            start_at: formData.start_at,
            end_at: formData.end_at,
            location: formData.location
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to generate project: ${response.status}`);
      }

      const data = await response.json();
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Projects</p>
            <h1>Create AI-Powered Project</h1>
            <p className="lede">
              Enter your project details and let AI generate tasks and budget estimates.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem", padding: "1rem", background: "#fee2e2", borderRadius: "8px", color: "#dc2626" }}>
            {error}
          </div>
        )}

        {step === "form" && (
          <section className="detail-card">
            <h3>Project Details</h3>
            <form onSubmit={handleGenerate} className="form">
              <div className="form-grid">
                <label>
                  Project Name *
                  <input
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Annual Tech Summit 2025"
                    required
                  />
                </label>
                <label>
                  Location *
                  <input
                    name="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Convention Center, New York"
                    required
                  />
                </label>
                <label>
                  Start Date *
                  <input
                    type="date"
                    name="start_at"
                    value={formData.start_at}
                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                    required
                  />
                </label>
                <label>
                  End Date *
                  <input
                    type="date"
                    name="end_at"
                    value={formData.end_at}
                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                    required
                  />
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  Description *
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Describe your project in detail. Include the type of event, expected attendees, key activities, and any special requirements..."
                    required
                  />
                </label>
              </div>
              <button className="action primary" type="submit">
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
          <section className="detail-card" style={{ textAlign: "center", padding: "3rem" }}>
            <div className="loading-spinner" style={{ marginBottom: "1rem" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <h3>Generating Your Project Plan...</h3>
            <p className="lede">AI is creating tasks and budget estimates based on your requirements.</p>
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
            <section className="detail-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3>Generated Tasks ({generatedData.tasks.length})</h3>
                <span className="status-badge" style={{ background: "#dcfce7", color: "#166534" }}>AI Generated</span>
              </div>
              <p className="lede" style={{ marginBottom: "1rem" }}>
                These tasks have been automatically generated based on your project description. You can edit them after saving.
              </p>
              <div className="list-grid">
                {generatedData.tasks.map((task, index) => (
                  <div key={task.id || index} className="list-card" style={{ cursor: "default" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <strong>{task.name}</strong>
                      <span className="status-badge">{task.status}</span>
                    </div>
                    <em>{task.description}</em>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
                      {task.due_at && <span>Due: {new Date(task.due_at).toLocaleDateString()}</span>}
                      {task.estimated_cost && <span>Est. Cost: {formatCurrency(task.estimated_cost)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="detail-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3>Budget Breakdown</h3>
                <strong style={{ fontSize: "1.25rem", color: "#4f46e5" }}>
                  Total: {formatCurrency(generatedData.project.total_budget)}
                </strong>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right" }}>Estimated Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedData.budget_items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td><strong>{item.category}</strong></td>
                        <td>{item.description}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(item.estimated_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button
                className="action secondary"
                onClick={() => {
                  setStep("form");
                  setGeneratedData(null);
                }}
              >
                Start Over
              </button>
              <button className="action primary" onClick={handleSave}>
                View Project
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
