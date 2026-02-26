"use client";

import { useState } from "react";

type Task = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  assignee_id?: string | null;
  start_at?: string | null;
  due_at?: string | null;
  parent_task_id?: string | null;
  reminder_enabled: boolean;
  reminder_days_before?: number | null;
  allocated_budget?: string | null;
  spent_budget?: string | null;
};

type User = {
  id: string;
  name?: string | null;
  email: string;
};

const statusColors: Record<string, string> = {
  pending: "#6b7280",
  in_progress: "#3b82f6",
  completed: "#22c55e",
  blocked: "#ef4444"
};

export function TaskCard({
  task,
  users,
  subtasks,
  updateAction,
  deleteAction,
  subtaskAction,
  updateSubtaskAction,
  deleteSubtaskAction
}: {
  task: Task;
  users: User[];
  subtasks: Task[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  subtaskAction: (formData: FormData) => Promise<void>;
  updateSubtaskAction: (formData: FormData) => Promise<void>;
  deleteSubtaskAction: (formData: FormData) => Promise<void>;
}) {
  const assignee = users.find(u => u.id === task.assignee_id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem", marginBottom: "0.75rem" }}>
      {!showEditForm ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <strong>{task.name}</strong>
              {task.description && <p style={{ margin: "0.25rem 0", fontSize: "0.85rem", opacity: 0.8 }}>{task.description}</p>}
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.85rem", flexWrap: "wrap" }}>
                {assignee && <span>Assigned to: {assignee.name ?? assignee.email}</span>}
                {task.due_at && <span style={{ color: new Date(task.due_at) < new Date() && task.status !== "completed" ? "#ef4444" : "inherit" }}>Due: {new Date(task.due_at).toLocaleDateString("en-US")}</span>}
                {task.reminder_enabled && <span>Reminder: {task.reminder_days_before} day(s) before</span>}
                {(parseFloat(task.allocated_budget ?? "0") > 0 || parseFloat(task.spent_budget ?? "0") > 0) && (
                  <span style={{ color: parseFloat(task.spent_budget ?? "0") > parseFloat(task.allocated_budget ?? "0") ? "#ef4444" : "inherit" }}>
                    Budget: ${parseFloat(task.spent_budget ?? "0").toLocaleString()} / ${parseFloat(task.allocated_budget ?? "0").toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <form action={updateAction}>
                <input type="hidden" name="task_id" value={task.id} />
                <select
                  name="status"
                  defaultValue={task.status}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  style={{ padding: "0.25rem 0.5rem", borderRadius: "4px", backgroundColor: statusColors[task.status], color: "white", border: "none", cursor: "pointer" }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </form>
              <button
                type="button"
                className="action ghost"
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                onClick={() => setShowEditForm(true)}
              >
                Edit
              </button>
              <form action={deleteAction}>
                <input type="hidden" name="task_id" value={task.id} />
                <button
                  type="submit"
                  className="action ghost"
                  style={{ padding: "0.25rem 0.5rem", color: "#ef4444", fontSize: "0.8rem" }}
                  onClick={(e) => {
                    if (!confirm("Delete this task and all subtasks?")) {
                      e.preventDefault();
                    }
                  }}
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        </>
      ) : (
        <form
          action={async (formData) => {
            await updateAction(formData);
            setShowEditForm(false);
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <input type="hidden" name="task_id" value={task.id} />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              name="name"
              defaultValue={task.name}
              placeholder="Task name"
              style={{ flex: 2, padding: "0.4rem 0.5rem", minWidth: "150px" }}
              required
            />
            <select
              name="assignee_id"
              defaultValue={task.assignee_id ?? ""}
              style={{ flex: 1, padding: "0.4rem 0.5rem", minWidth: "120px" }}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name ?? user.email}
                </option>
              ))}
            </select>
          </div>
          <textarea
            name="description"
            defaultValue={task.description ?? ""}
            placeholder="Description"
            rows={2}
            style={{ padding: "0.4rem 0.5rem" }}
          />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              type="date"
              name="due_at"
              defaultValue={task.due_at?.split("T")[0] ?? ""}
              style={{ flex: 1, padding: "0.4rem 0.5rem", minWidth: "120px" }}
            />
            <select
              name="status"
              defaultValue={task.status}
              style={{ flex: 1, padding: "0.4rem 0.5rem", minWidth: "100px" }}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
            <input
              type="number"
              name="allocated_budget"
              defaultValue={task.allocated_budget ?? ""}
              placeholder="Budget"
              step="0.01"
              min="0"
              style={{ flex: 1, padding: "0.4rem 0.5rem", minWidth: "80px" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="action ghost"
              style={{ padding: "0.25rem 0.5rem" }}
              onClick={() => setShowEditForm(false)}
            >
              Cancel
            </button>
            <button type="submit" className="action primary" style={{ padding: "0.25rem 0.5rem" }}>
              Save
            </button>
          </div>
        </form>
      )}

      <details style={{ marginTop: "0.75rem" }}>
        <summary style={{ cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}>
          Subtasks {subtasks.length > 0 && <span style={{ color: "#6b7280" }}>({subtasks.length})</span>}
        </summary>

        {subtasks.length > 0 && (
          <div style={{ marginTop: "0.75rem", marginLeft: "0.5rem", borderLeft: "2px solid var(--border, #e5e7eb)", paddingLeft: "0.75rem" }}>
            {subtasks.map((subtask) => {
              const subtaskAssignee = users.find(u => u.id === subtask.assignee_id);
              const isOverdue = subtask.due_at && new Date(subtask.due_at) < new Date() && subtask.status !== "completed";
              return (
                <div
                  key={subtask.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid var(--border, #e5e7eb)"
                  }}
                >
                  <form action={updateSubtaskAction}>
                    <input type="hidden" name="task_id" value={task.id} />
                    <input type="hidden" name="subtask_id" value={subtask.id} />
                    <input
                      type="checkbox"
                      checked={subtask.status === "completed"}
                      onChange={(e) => {
                        const form = e.currentTarget.form;
                        if (form) {
                          const statusInput = document.createElement("input");
                          statusInput.type = "hidden";
                          statusInput.name = "status";
                          statusInput.value = e.target.checked ? "completed" : "pending";
                          form.appendChild(statusInput);
                          form.requestSubmit();
                        }
                      }}
                      style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#22c55e" }}
                    />
                  </form>

                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 500,
                      fontSize: "0.9rem",
                      textDecoration: subtask.status === "completed" ? "line-through" : "none",
                      opacity: subtask.status === "completed" ? 0.6 : 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {subtask.name}
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "#6b7280", marginTop: "0.15rem" }}>
                      {subtaskAssignee && (
                        <span>{subtaskAssignee.name ?? subtaskAssignee.email}</span>
                      )}
                      {subtask.due_at && (
                        <span style={{ color: isOverdue ? "#ef4444" : "#6b7280" }}>
                          {isOverdue ? "Overdue: " : "Due: "}{new Date(subtask.due_at).toLocaleDateString("en-US")}
                        </span>
                      )}
                      <span style={{
                        padding: "0 0.35rem",
                        borderRadius: "3px",
                        backgroundColor: statusColors[subtask.status] ?? "#6b7280",
                        color: "white",
                        fontSize: "0.65rem",
                        textTransform: "uppercase"
                      }}>
                        {subtask.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <form action={deleteSubtaskAction}>
                    <input type="hidden" name="task_id" value={task.id} />
                    <input type="hidden" name="subtask_id" value={subtask.id} />
                    <button
                      type="submit"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#9ca3af",
                        cursor: "pointer",
                        fontSize: "1rem",
                        padding: "0.25rem",
                        lineHeight: 1,
                        borderRadius: "4px"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = "#ef4444"}
                      onMouseOut={(e) => e.currentTarget.style.color = "#9ca3af"}
                      onClick={(e) => {
                        if (!confirm("Delete this subtask?")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      ×
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: "0.75rem" }}>
          {!showAddForm ? (
            <button
              type="button"
              className="action ghost"
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
              onClick={() => setShowAddForm(true)}
            >
              + Add subtask
            </button>
          ) : (
            <form
              action={async (formData) => {
                await subtaskAction(formData);
                setShowAddForm(false);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                padding: "1rem",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px"
              }}
            >
              <input type="hidden" name="parent_task_id" value={task.id} />

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "#374151", marginBottom: "0.25rem" }}>
                  Subtask name *
                </label>
                <input
                  name="name"
                  placeholder="Enter subtask name"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    backgroundColor: "white"
                  }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "#374151", marginBottom: "0.25rem" }}>
                    Assignee
                  </label>
                  <select
                    name="assignee_id"
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      backgroundColor: "white"
                    }}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name ?? user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "#374151", marginBottom: "0.25rem" }}>
                    Due date
                  </label>
                  <input
                    type="date"
                    name="due_at"
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      backgroundColor: "white"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "#374151", marginBottom: "0.25rem" }}>
                  Status
                </label>
                <select
                  name="status"
                  defaultValue="pending"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    backgroundColor: "white"
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
                <button
                  type="button"
                  className="action ghost"
                  style={{ padding: "0.5rem 1rem" }}
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action primary"
                  style={{ padding: "0.5rem 1rem" }}
                >
                  Add subtask
                </button>
              </div>
            </form>
          )}
        </div>
      </details>
    </div>
  );
}
