"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { db } from "@/app/lib/supabase/db";

export async function getTasks(projectId?: string) {
  const tasks = await db.tasks.list(projectId);
  return { items: tasks };
}

export async function getTask(id: string) {
  const task = await db.tasks.get(id);
  if (!task) {
    return { error: "Task not found" };
  }
  return { item: task };
}

export async function createTask(input: {
  tenant_id: string;
  project_id: string;
  name: string;
  description?: string;
  status?: "todo" | "in_progress" | "blocked" | "done";
  priority?: number;
  due_at?: string;
  estimated_cost?: number;
  order_index?: number;
}) {
  const task = await db.tasks.create({
    tenant_id: input.tenant_id,
    project_id: input.project_id,
    name: input.name,
    description: input.description,
    status: input.status || "todo",
    priority: input.priority || 0,
    due_at: input.due_at,
    estimated_cost: input.estimated_cost,
    order_index: input.order_index || 0,
    ai_generated: false
  });
  revalidatePath(`/projects/${input.project_id}`);
  return { item: task };
}

export async function updateTask(id: string, input: {
  name?: string;
  description?: string;
  status?: "todo" | "in_progress" | "blocked" | "done";
  priority?: number;
  due_at?: string | null;
  estimated_cost?: number | null;
  order_index?: number;
}) {
  const task = await db.tasks.update(id, input);
  if (!task) {
    return { error: "Task not found" };
  }
  revalidatePath(`/projects/${task.project_id}`);
  return { item: task };
}

export async function deleteTask(id: string) {
  const task = await db.tasks.get(id);
  if (!task) {
    return { error: "Task not found" };
  }
  const deleted = await db.tasks.delete(id);
  if (!deleted) {
    return { error: "Failed to delete task" };
  }
  revalidatePath(`/projects/${task.project_id}`);
  return { success: true };
}

export async function assignTask(taskId: string, email: string) {
  const task = await db.tasks.get(taskId);
  if (!task) {
    return { error: "Task not found" };
  }

  const updatedTask = await db.tasks.update(taskId, { assignee_email: email });
  if (!updatedTask) {
    return { error: "Failed to assign task" };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.taskAccessTokens.create({
    tenant_id: task.tenant_id,
    task_id: taskId,
    email,
    token,
    expires_at: expiresAt.toISOString()
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const accessLink = `${appUrl}/tasks/public/${token}`;

  revalidatePath(`/projects/${task.project_id}`);
  return { task: updatedTask, accessToken: token, accessLink };
}

export async function getTaskByToken(token: string) {
  const accessToken = await db.taskAccessTokens.getByToken(token);
  if (!accessToken) {
    return null;
  }

  await db.taskAccessTokens.updateLastUsed(accessToken.id);

  const task = await db.tasks.get(accessToken.task_id);
  if (!task) {
    return null;
  }

  const comments = await db.taskComments.list(accessToken.task_id);
  return { task, comments };
}

export async function updateTaskByToken(token: string, input: {
  status?: "todo" | "in_progress" | "blocked" | "done";
  comment?: string;
}) {
  const accessToken = await db.taskAccessTokens.getByToken(token);
  if (!accessToken) {
    return null;
  }

  if (input.status) {
    await db.tasks.update(accessToken.task_id, { status: input.status });
  }

  if (input.comment) {
    await db.taskComments.create({
      tenant_id: accessToken.tenant_id,
      task_id: accessToken.task_id,
      author_email: accessToken.email,
      content: input.comment
    });
  }

  const task = await db.tasks.get(accessToken.task_id);
  return { task };
}
