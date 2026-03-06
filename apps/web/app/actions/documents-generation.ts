"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/supabase/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function generateDocumentContent(taskName: string, taskDescription: string, projectName: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `# ${taskName}\n\n${taskDescription || "No description provided."}\n\n## Overview\n\nThis document relates to the task "${taskName}" in project "${projectName}".`;
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Generate a professional document for the following task:

Task Name: ${taskName}
Task Description: ${taskDescription || "No description provided"}
Project Name: ${projectName}

Create a well-structured markdown document that includes:
1. An overview of the task
2. Key objectives
3. Steps or actions required
4. Any relevant considerations
5. Expected outcomes

Keep it professional and concise. Use proper markdown formatting.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

export async function generateDocumentFromTask(taskId: string, projectId: string, tenantId: string) {
  const task = await db.tasks.get(taskId);
  if (!task) {
    return { error: "Task not found" };
  }

  const project = await db.projects.get(projectId);
  if (!project) {
    return { error: "Project not found" };
  }

  const content = await generateDocumentContent(
    task.name,
    task.description || "",
    project.name
  );

  const document = await db.documents.create({
    tenant_id: tenantId,
    project_id: projectId,
    task_id: taskId,
    title: `${task.name} - Documentation`,
    content,
    content_type: "markdown",
    ai_generated: true,
    created_by: "ai"
  });

  revalidatePath(`/projects/${projectId}/documents`);
  return { document };
}

export async function generateProjectSummary(projectId: string, tenantId: string) {
  const project = await db.projects.get(projectId);
  if (!project) {
    return { error: "Project not found" };
  }

  const tasks = await db.tasks.list(projectId);
  const budgetItems = await db.budgetItems.list(projectId);

  if (!GEMINI_API_KEY) {
    const content = `# ${project.name} - Project Summary\n\n${project.description || ""}\n\n## Tasks (${tasks.length})\n\n${tasks.map(t => `- ${t.name}: ${t.status}`).join("\n")}\n\n## Budget\n\nTotal: ${project.currency} ${project.total_budget}`;
    const document = await db.documents.create({
      tenant_id: tenantId,
      project_id: projectId,
      title: `${project.name} - Summary`,
      content,
      content_type: "markdown",
      ai_generated: true,
      created_by: "ai"
    });
    revalidatePath(`/projects/${projectId}/documents`);
    return { document };
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const tasksSummary = tasks.map(t => `- ${t.name} (${t.status}): ${t.description || "No description"}`).join("\n");
  const budgetSummary = budgetItems.map(b => `- ${b.category}: ${b.estimated_amount}`).join("\n");

  const prompt = `Generate a comprehensive project summary document for:

Project Name: ${project.name}
Description: ${project.description || "No description"}
Location: ${project.location || "Not specified"}
Timeline: ${project.start_at} to ${project.end_at}
Total Budget: ${project.currency} ${project.total_budget}

Tasks:
${tasksSummary || "No tasks defined"}

Budget Categories:
${budgetSummary || "No budget items"}

Create a professional markdown document that includes:
1. Executive summary
2. Project overview
3. Timeline and milestones
4. Task breakdown
5. Budget overview
6. Recommendations

Keep it professional and well-structured.`;

  const result = await model.generateContent(prompt);
  const content = result.response.text();

  const document = await db.documents.create({
    tenant_id: tenantId,
    project_id: projectId,
    title: `${project.name} - Project Summary`,
    content,
    content_type: "markdown",
    ai_generated: true,
    created_by: "ai"
  });

  revalidatePath(`/projects/${projectId}/documents`);
  return { document };
}
