import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Header } from "../../../../ui/header";
import { api } from "../../../../lib/api";
import { TaskCard } from "./task-card";

type Phase = {
  id: string;
  name: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
};

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

async function getPhase(programId: string, phaseId: string) {
  const { data } = await api.get<{ items: Phase[] }>(`/api/v1/programs/${programId}/phases`);
  return data?.items?.find(p => p.id === phaseId) ?? null;
}

async function getPhaseTasks(phaseId: string) {
  return api.get<{ items: Task[] }>(`/api/v1/phases/${phaseId}/tasks`);
}

async function getSubtasks(phaseId: string, taskId: string) {
  return api.get<{ items: Task[] }>(`/api/v1/phases/${phaseId}/tasks/${taskId}/subtasks`);
}

async function getUsers() {
  return api.get<{ items: User[] }>("/api/v1/users");
}

interface PhasePageProps {
  params: Promise<{ id: string; phaseId: string }>;
}

export default async function PhaseDetailPage({ params }: PhasePageProps) {
  const { id, phaseId } = await params;
  const [phase, { data: tasksData }, { data: usersData }] = await Promise.all([
    getPhase(id, phaseId),
    getPhaseTasks(phaseId),
    getUsers()
  ]);

  const tasks = tasksData?.items ?? [];
  const users = usersData?.items ?? [];

  const subtasksMap: Record<string, Task[]> = {};
  await Promise.all(
    tasks.map(async (task) => {
      const { data } = await getSubtasks(phaseId, task.id);
      subtasksMap[task.id] = data?.items ?? [];
    })
  );

  async function createTask(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const assigneeId = String(formData.get("assignee_id") ?? "").trim();
    const dueAt = String(formData.get("due_at") ?? "").trim();
    const reminderEnabled = formData.get("reminder_enabled") === "on";
    const reminderDaysBefore = parseInt(String(formData.get("reminder_days_before") ?? "1"), 10);

    if (!name) {
      throw new Error("Task name is required");
    }

    const allocatedBudget = parseFloat(String(formData.get("allocated_budget") ?? "0"));

    const { error } = await api.post(`/api/v1/phases/${phaseId}/tasks`, {
      name,
      description: description || undefined,
      assignee_id: assigneeId || undefined,
      due_at: dueAt || undefined,
      reminder_enabled: reminderEnabled,
      reminder_days_before: reminderEnabled ? reminderDaysBefore : undefined,
      allocated_budget: allocatedBudget > 0 ? allocatedBudget : undefined
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath(`/programs/${id}/phases/${phaseId}`);
  }

  async function createSubtask(formData: FormData) {
    "use server";
    const parentTaskId = String(formData.get("parent_task_id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const assigneeId = String(formData.get("assignee_id") ?? "").trim();
    const dueAt = String(formData.get("due_at") ?? "").trim();
    const status = String(formData.get("status") ?? "pending").trim();

    if (!name || !parentTaskId) {
      throw new Error("Subtask name is required");
    }

    const { error } = await api.post(`/api/v1/phases/${phaseId}/tasks/${parentTaskId}/subtasks`, {
      name,
      assignee_id: assigneeId || undefined,
      due_at: dueAt || undefined,
      status: status || undefined
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath(`/programs/${id}/phases/${phaseId}`);
  }

  async function updateSubtask(formData: FormData) {
    "use server";
    const taskId = String(formData.get("task_id") ?? "").trim();
    const subtaskId = String(formData.get("subtask_id") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();

    if (!subtaskId) {
      throw new Error("Subtask ID is required");
    }

    const { error } = await api.patch(`/api/v1/phases/${phaseId}/tasks/${taskId}/subtasks/${subtaskId}`, {
      status
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath(`/programs/${id}/phases/${phaseId}`);
  }

  async function updateTask(formData: FormData) {
    "use server";
    const taskId = String(formData.get("task_id") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const assigneeId = String(formData.get("assignee_id") ?? "").trim();
    const dueAt = String(formData.get("due_at") ?? "").trim();
    const allocatedBudget = parseFloat(String(formData.get("allocated_budget") ?? "0"));

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (assigneeId) updateData.assignee_id = assigneeId;
    if (dueAt) updateData.due_at = dueAt;
    if (allocatedBudget > 0) updateData.allocated_budget = allocatedBudget;

    const { error } = await api.patch(`/api/v1/phases/${phaseId}/tasks/${taskId}`, updateData);

    if (error) {
      throw new Error(error);
    }

    revalidatePath(`/programs/${id}/phases/${phaseId}`);
  }

  async function deleteTask(formData: FormData) {
    "use server";
    const taskId = String(formData.get("task_id") ?? "").trim();

    if (!taskId) {
      throw new Error("Task ID is required");
    }

    const { error } = await api.delete(`/api/v1/phases/${phaseId}/tasks/${taskId}`);

    if (error) {
      throw new Error(error);
    }

    revalidatePath(`/programs/${id}/phases/${phaseId}`);
  }

  async function deleteSubtask(formData: FormData) {
    "use server";
    const taskId = String(formData.get("task_id") ?? "").trim();
    const subtaskId = String(formData.get("subtask_id") ?? "").trim();

    if (!subtaskId) {
      throw new Error("Subtask ID is required");
    }

    const { error } = await api.delete(`/api/v1/phases/${phaseId}/tasks/${taskId}/subtasks/${subtaskId}`);

    if (error) {
      throw new Error(error);
    }

    revalidatePath(`/programs/${id}/phases/${phaseId}`);
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Phase</p>
            <h1>{phase?.name ?? "Phase detail"}</h1>
            {phase?.description && <p className="lede">{phase.description}</p>}
            <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
              {phase?.start_at ? new Date(phase.start_at).toLocaleDateString() : "No start"} - {phase?.end_at ? new Date(phase.end_at).toLocaleDateString() : "No end"}
            </p>
          </div>
          <Link href={`/programs/${id}`} className="action secondary">
            Back to Program
          </Link>
        </div>

        <section className="detail-grid">
          <div className="detail-card" style={{ gridColumn: "1 / -1" }}>
            <h3>Tasks</h3>
            <p>Manage tasks for this phase. Assign to users and set due dates.</p>

            {tasks.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    users={users}
                    subtasks={subtasksMap[task.id] ?? []}
                    updateAction={updateTask}
                    deleteAction={deleteTask}
                    subtaskAction={createSubtask}
                    updateSubtaskAction={updateSubtask}
                    deleteSubtaskAction={deleteSubtask}
                  />
                ))}
              </div>
            )}

            <details style={{ marginTop: "1rem" }}>
              <summary className="action ghost">Add task</summary>
              <form action={createTask} className="form" style={{ marginTop: "1rem" }}>
                <div className="form-grid">
                  <label>
                    Task name
                    <input name="name" placeholder="Review documentation" required />
                  </label>
                  <label>
                    Description
                    <textarea name="description" rows={2} placeholder="Optional description" />
                  </label>
                  <label>
                    Assignee
                    <select name="assignee_id">
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name ?? user.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Due date
                    <input type="date" name="due_at" />
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input type="checkbox" name="reminder_enabled" />
                    Enable email reminder
                  </label>
                  <label>
                    Reminder days before
                    <input type="number" name="reminder_days_before" defaultValue={1} min={1} />
                  </label>
                  <label>
                    Allocated Budget
                    <input type="number" name="allocated_budget" placeholder="0.00" min={0} step="0.01" />
                  </label>
                </div>
                <button className="action primary" type="submit">
                  Create task
                </button>
              </form>
            </details>
          </div>
        </section>
      </main>
    </div>
  );
}

