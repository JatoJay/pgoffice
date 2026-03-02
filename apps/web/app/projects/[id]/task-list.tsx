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
  currency: string;
};

const statusOptions = ["todo", "pending", "in_progress", "done", "blocked"];

export function TaskList({ tasks: initialTasks, projectId, tenantId, currency }: TaskListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD"
    }).format(amount);
  };
  const [tasks, setTasks] = useState(initialTasks);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [assignEmail, setAssignEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditForm({
      name: task.name,
      description: task.description || "",
      status: task.status,
      estimated_cost: task.estimated_cost,
      due_at: task.due_at ? task.due_at.split("T")[0] : ""
    });
    setAssigningTaskId(null);
  };

  const handleSaveEdit = async (taskId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/v1/ai-projects/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-super-admin": "true"
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          status: editForm.status,
          estimated_cost: editForm.estimated_cost ? Number(editForm.estimated_cost) : null,
          due_at: editForm.due_at || null
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update task: ${res.status}`);
      }

      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, ...editForm, estimated_cost: editForm.estimated_cost ? Number(editForm.estimated_cost) : null } : t
      ));

      setSuccess("Task updated successfully");
      setEditingTaskId(null);
      setEditForm({});
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/v1/ai-projects/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "x-tenant-id": tenantId,
          "x-super-admin": "true"
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to delete task: ${res.status}`);
      }

      setTasks(tasks.filter(t => t.id !== taskId));
      setSuccess("Task deleted");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete task");
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
    todo: { bg: "rgba(156, 163, 175, 0.2)", color: "#9ca3af" },
    pending: { bg: "rgba(234, 179, 8, 0.2)", color: "#eab308" },
    in_progress: { bg: "rgba(59, 130, 246, 0.2)", color: "#3b82f6" },
    done: { bg: "rgba(34, 197, 94, 0.2)", color: "#22c55e" },
    completed: { bg: "rgba(34, 197, 94, 0.2)", color: "#22c55e" },
    blocked: { bg: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }
  };

  const inputStyle = {
    padding: "0.5rem 0.75rem",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "6px",
    fontSize: "0.875rem",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#fff",
    width: "100%"
  };

  return (
    <section className="detail-card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3>Tasks ({tasks.length})</h3>
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

      {tasks.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No tasks yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {tasks.sort((a, b) => a.order_index - b.order_index).map((task) => {
            const statusStyle = statusColors[task.status] || statusColors.pending;
            const isEditing = editingTaskId === task.id;

            return (
              <div
                key={task.id}
                style={{
                  border: isEditing ? "1px solid #22c55e" : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  background: isEditing ? "rgba(34, 197, 94, 0.05)" : "rgba(255, 255, 255, 0.03)"
                }}
              >
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Task name"
                      style={inputStyle}
                    />
                    <textarea
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Description"
                      rows={2}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                      <select
                        value={editForm.status || "todo"}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        style={inputStyle}
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={editForm.estimated_cost || ""}
                        onChange={(e) => setEditForm({ ...editForm, estimated_cost: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Est. cost"
                        style={inputStyle}
                      />
                      <input
                        type="date"
                        value={editForm.due_at || ""}
                        onChange={(e) => setEditForm({ ...editForm, due_at: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleSaveEdit(task.id)}
                        disabled={loading}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "#22c55e",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: loading ? "wait" : "pointer",
                          fontSize: "0.875rem",
                          fontWeight: 500
                        }}
                      >
                        {loading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditingTaskId(null); setEditForm({}); }}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "rgba(255, 255, 255, 0.1)",
                          color: "#9ca3af",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.875rem"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          marginLeft: "auto"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <strong style={{ fontSize: "1rem", color: "#fff" }}>{task.name}</strong>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
                        <button
                          onClick={() => handleEdit(task)}
                          style={{
                            padding: "0.25rem 0.5rem",
                            background: "transparent",
                            color: "#9ca3af",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.75rem"
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {task.description && (
                      <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.875rem", color: "#9ca3af" }}>
                      {task.due_at && (
                        <span>Due: {formatDate(task.due_at)}</span>
                      )}
                      {task.estimated_cost && (
                        <span>Est: {formatCurrency(task.estimated_cost)}</span>
                      )}
                      {task.assigned_email && (
                        <span style={{ color: "#22c55e" }}>
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
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button
                          onClick={() => handleAssign(task.id)}
                          disabled={loading}
                          style={{
                            padding: "0.5rem 1rem",
                            background: "#22c55e",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: loading ? "wait" : "pointer",
                            fontSize: "0.875rem",
                            fontWeight: 500
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
                            background: "rgba(255, 255, 255, 0.1)",
                            color: "#9ca3af",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
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
                          onClick={() => { setAssigningTaskId(task.id); setEditingTaskId(null); }}
                          style={{
                            padding: "0.5rem 1rem",
                            background: task.assigned_email ? "rgba(34, 197, 94, 0.15)" : "#22c55e",
                            color: task.assigned_email ? "#22c55e" : "#fff",
                            border: task.assigned_email ? "1px solid rgba(34, 197, 94, 0.3)" : "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            fontWeight: 500
                          }}
                        >
                          {task.assigned_email ? "Reassign" : "Assign Task"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
