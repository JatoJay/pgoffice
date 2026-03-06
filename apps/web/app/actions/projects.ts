"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/supabase/db";
import type { InsertTables, UpdateTables } from "@/app/lib/supabase/types";

export async function getProjects(instanceId?: string) {
  const projects = await db.projects.list(instanceId);
  return { items: projects };
}

export async function getProject(id: string) {
  const project = await db.projects.get(id);
  if (!project) {
    return { error: "Project not found" };
  }
  const tasks = await db.tasks.list(id);
  const budgetItems = await db.budgetItems.list(id);
  return { project, tasks, budget_items: budgetItems };
}

export async function createProject(input: {
  tenant_id: string;
  instance_id?: string;
  name: string;
  description?: string;
  location?: string;
  status?: string;
  start_at?: string;
  end_at?: string;
}) {
  const project = await db.projects.create({
    tenant_id: input.tenant_id,
    instance_id: input.instance_id,
    name: input.name,
    description: input.description,
    location: input.location,
    status: input.status || "draft",
    start_at: input.start_at,
    end_at: input.end_at
  });
  revalidatePath("/projects");
  return { item: project };
}

export async function updateProject(id: string, input: {
  name?: string;
  description?: string;
  location?: string;
  status?: string;
  start_at?: string;
  end_at?: string;
  total_budget?: number;
  currency?: string;
}) {
  const project = await db.projects.update(id, input);
  if (!project) {
    return { error: "Project not found" };
  }
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  return { item: project };
}

export async function deleteProject(id: string) {
  const deleted = await db.projects.delete(id);
  if (!deleted) {
    return { error: "Failed to delete project" };
  }
  revalidatePath("/projects");
  return { success: true };
}
