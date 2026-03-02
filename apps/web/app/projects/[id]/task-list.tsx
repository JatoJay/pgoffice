"use client";

import { useState } from "react";

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

type TaskListProps = {
  tasks: Task[];
  projectId: string;
  tenantId: string;
  formatCurrency: (amount: number) => string;
};

export function TaskList({ tasks: initialTasks, projectId, tenantId, formatCurrency }: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [assignEmail, setAssignEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleAssign = async (taskId: string) => {
    if (!assignEmail.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/v1/ai-projects/tasks/${taskId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-super-admin": "true"
        },
        body: JSON.stringify({ email: assignEmail })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to assign task: ${res.status}`);
      }

      const result = await res.json();

      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, assigned_email: assignEmail } : t
      ));

      setSuccess(`Task assigned! Access link sent to ${assignEmail}`);
      setAssigningTaskId(null);
      setAssignEmail("");

      setTimeout(() => setSuccess(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign task");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#fef3c7", color: "#92400e" },
    in_progress: { bg: "#dbeafe", color: "#1e40af" },
    completed: { bg: "#dcfce7", color: "#166534" },
    blocked: { bg: "#fee2e2", color: "#991b1b" }
  };

  return (
    <section className="detail-card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3>Tasks ({tasks.length})</h3>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
          {success}
        </div>
      )}

      {tasks.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No tasks yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {tasks.sort((a, b) => a.order_index - b.order_index).map((task) => {
            const statusStyle = statusColors[task.status] || statusColors.pending;
            return (
              <div
                key={task.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "1rem",
                  background: "#fff"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <strong style={{ fontSize: "1rem" }}>{task.name}</strong>
                  <span
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      padding: "0.125rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      textTransform: "capitalize"
                    }}
                  >
                    {task.status.replace("_", " ")}
                  </span>
                </div>

                {task.description && (
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                    {task.description}
                  </p>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
                  {task.due_at && (
                    <span>Due: {formatDate(task.due_at)}</span>
                  )}
                  {task.estimated_cost && (
                    <span>Est: {formatCurrency(task.estimated_cost)}</span>
                  )}
                  {task.assigned_email && (
                    <span style={{ color: "#059669" }}>
                      Assigned: {task.assigned_email}
                    </span>
                  )}
                </div>

                {assigningTaskId === task.id ? (
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input
                      type="email"
                      placeholder="assignee@email.com"
                      value={assignEmail}
                      onChange={(e) => setAssignEmail(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "0.875rem"
                      }}
                    />
                    <button
                      onClick={() => handleAssign(task.id)}
                      disabled={loading}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#4f46e5",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: loading ? "wait" : "pointer",
                        fontSize: "0.875rem"
                      }}
                    >
                      {loading ? "Sending..." : "Send"}
                    </button>
                    <button
                      onClick={() => {
                        setAssigningTaskId(null);
                        setAssignEmail("");
                        setError(null);
                      }}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#f3f4f6",
                        color: "#374151",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.875rem"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: "0.75rem" }}>
                    <button
                      onClick={() => setAssigningTaskId(task.id)}
                      style={{
                        padding: "0.375rem 0.75rem",
                        background: task.assigned_email ? "#f3f4f6" : "#4f46e5",
                        color: task.assigned_email ? "#374151" : "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.75rem"
                      }}
                    >
                      {task.assigned_email ? "Reassign" : "Assign Task"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
