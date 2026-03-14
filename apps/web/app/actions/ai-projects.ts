"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/supabase/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

type GeneratedTask = {
  name: string;
  description: string;
  priority: number;
  estimated_cost: number;
  order_index: number;
};

type GeneratedBudgetItem = {
  category: string;
  description: string;
  estimated_amount: number;
  order_index: number;
};

type GeneratedProject = {
  tasks: GeneratedTask[];
  budget_items: GeneratedBudgetItem[];
  total_budget: number;
  currency: string;
};

async function generateProjectPlan(input: {
  name: string;
  description: string;
  timeline: { start_date: string; end_date: string };
  location: string;
}): Promise<GeneratedProject> {
  if (!GEMINI_API_KEY) {
    throw new Error("AI features are not available. Please configure GEMINI_API_KEY in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an expert project manager. Generate a detailed project plan for the following project:

Project Name: ${input.name}
Description: ${input.description}
Location: ${input.location}
Timeline: ${input.timeline.start_date} to ${input.timeline.end_date}

Generate a JSON response with the following structure:
{
  "tasks": [
    {
      "name": "Task name",
      "description": "Detailed task description",
      "priority": 1-5 (1 being highest priority),
      "estimated_cost": estimated cost in USD as a number,
      "order_index": sequential order starting from 0
    }
  ],
  "budget_items": [
    {
      "category": "Category name (e.g., Personnel, Equipment, Materials, Services)",
      "description": "What this budget covers",
      "estimated_amount": amount in USD as a number,
      "order_index": sequential order starting from 0
    }
  ],
  "total_budget": sum of all budget items as a number,
  "currency": "USD"
}

Generate 8-12 tasks and 5-8 budget items that are realistic for this project.
Respond ONLY with valid JSON, no markdown or explanation.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedProject;
  return parsed;
}

function calculateDueDate(
  startAt: string,
  endAt: string,
  orderIndex: number,
  totalTasks: number
): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const totalDays = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysPerTask = totalDays / totalTasks;
  const taskDueDate = new Date(
    start.getTime() + daysPerTask * (orderIndex + 1) * 24 * 60 * 60 * 1000
  );
  return taskDueDate.toISOString();
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateProject(input: {
  instance_id: string;
  name: string;
  description: string;
  start_at: string;
  end_at: string;
  location: string;
}) {
  if (!input.instance_id || !UUID_REGEX.test(input.instance_id)) {
    throw new Error("Invalid instance ID. Please select a valid instance first.");
  }

  const generated = await generateProjectPlan({
    name: input.name,
    description: input.description,
    timeline: { start_date: input.start_at, end_date: input.end_at },
    location: input.location
  });

  const project = await db.projects.create({
    tenant_id: input.instance_id,
    instance_id: input.instance_id,
    name: input.name,
    description: input.description,
    location: input.location,
    status: "draft",
    start_at: input.start_at,
    end_at: input.end_at,
    total_budget: generated.total_budget,
    currency: generated.currency,
    ai_generated: true,
    ai_generated_at: new Date().toISOString()
  });

  const tasks = [];
  for (const task of generated.tasks) {
    const dueDate = calculateDueDate(
      input.start_at,
      input.end_at,
      task.order_index,
      generated.tasks.length
    );
    const createdTask = await db.tasks.create({
      tenant_id: input.instance_id,
      project_id: project.id,
      name: task.name,
      description: task.description,
      status: "todo",
      priority: task.priority,
      due_at: dueDate,
      estimated_cost: task.estimated_cost,
      order_index: task.order_index,
      ai_generated: true
    });
    tasks.push(createdTask);
  }

  const budgetItems = [];
  for (const item of generated.budget_items) {
    const createdItem = await db.budgetItems.create({
      tenant_id: input.instance_id,
      project_id: project.id,
      category: item.category,
      description: item.description,
      estimated_amount: item.estimated_amount,
      ai_generated: true,
      order_index: item.order_index
    });
    budgetItems.push(createdItem);
  }

  revalidatePath("/projects");
  return { project, tasks, budget_items: budgetItems };
}

export async function addTask(
  projectId: string,
  input: {
    name: string;
    description?: string;
    priority?: number;
    due_at?: string;
    estimated_cost?: number;
    order_index?: number;
  }
) {
  const project = await db.projects.get(projectId);
  if (!project) {
    return { error: "Project not found" };
  }

  const task = await db.tasks.create({
    tenant_id: project.tenant_id,
    project_id: projectId,
    name: input.name,
    description: input.description,
    status: "todo",
    priority: input.priority || 0,
    due_at: input.due_at,
    estimated_cost: input.estimated_cost,
    order_index: input.order_index || 0,
    ai_generated: false
  });

  revalidatePath(`/projects/${projectId}`);
  return { item: task };
}

export async function addBudgetItem(
  projectId: string,
  input: {
    category: string;
    description?: string;
    estimated_amount: number;
  }
) {
  const project = await db.projects.get(projectId);
  if (!project) {
    return { error: "Project not found" };
  }

  const item = await db.budgetItems.create({
    tenant_id: project.tenant_id,
    project_id: projectId,
    category: input.category,
    description: input.description,
    estimated_amount: input.estimated_amount,
    ai_generated: false
  });

  revalidatePath(`/projects/${projectId}`);
  return { item };
}

export async function updateBudgetItem(
  itemId: string,
  input: {
    category?: string;
    description?: string;
    estimated_amount?: number;
    actual_amount?: number;
  }
) {
  const item = await db.budgetItems.update(itemId, input);
  if (!item) {
    return { error: "Budget item not found" };
  }
  revalidatePath(`/projects/${item.project_id}`);
  return { item };
}

export async function deleteBudgetItem(itemId: string) {
  const deleted = await db.budgetItems.delete(itemId);
  if (!deleted) {
    return { error: "Failed to delete budget item" };
  }
  return { success: true };
}
