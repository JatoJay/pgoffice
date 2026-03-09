"use server";

import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function generateDocumentFromTask(taskId: string, projectId: string, tenantId: string) {
  const res = await fetch(`${API_URL}/api/v1/documents/generate/task/${taskId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId,
      "x-super-admin": "true"
    },
    body: JSON.stringify({ project_id: projectId })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message || `Failed to generate document: ${res.status}` };
  }

  const { document } = await res.json();
  revalidatePath(`/projects/${projectId}/documents`);
  return { document };
}

export async function generateProjectSummary(projectId: string, tenantId: string) {
  const res = await fetch(`${API_URL}/api/v1/documents/generate/project/${projectId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId,
      "x-super-admin": "true"
    }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.message || `Failed to generate document: ${res.status}` };
  }

  const { document } = await res.json();
  revalidatePath(`/projects/${projectId}/documents`);
  return { document };
}
