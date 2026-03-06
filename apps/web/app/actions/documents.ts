"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/supabase/db";
import { createClient } from "@/app/lib/supabase/server";

export async function getDocuments(projectId: string) {
  const documents = await db.documents.list(projectId);
  return { documents };
}

export async function getDocument(id: string) {
  const document = await db.documents.get(id);
  if (!document) {
    return { error: "Document not found" };
  }
  return { document };
}

export async function createDocument(input: {
  tenant_id: string;
  project_id: string;
  task_id?: string;
  title: string;
  content?: string;
  content_type?: string;
  ai_generated?: boolean;
  created_by?: string;
}) {
  const document = await db.documents.create({
    tenant_id: input.tenant_id,
    project_id: input.project_id,
    task_id: input.task_id,
    title: input.title,
    content: input.content || "",
    content_type: input.content_type || "markdown",
    ai_generated: input.ai_generated || false,
    created_by: input.created_by
  });
  revalidatePath(`/projects/${input.project_id}/documents`);
  return { document };
}

export async function updateDocument(id: string, input: {
  title?: string;
  content?: string;
  status?: string;
  updated_by?: string;
}) {
  const document = await db.documents.update(id, input);
  if (!document) {
    return { error: "Document not found" };
  }
  if (document.project_id) {
    revalidatePath(`/projects/${document.project_id}/documents`);
  }
  return { document };
}

export async function deleteDocument(id: string) {
  const document = await db.documents.get(id);
  if (!document) {
    return { error: "Document not found" };
  }

  if (document.file_path) {
    const supabase = await createClient();
    await supabase.storage.from("documents").remove([document.file_path]);
  }

  const deleted = await db.documents.delete(id);
  if (!deleted) {
    return { error: "Failed to delete document" };
  }
  if (document.project_id) {
    revalidatePath(`/projects/${document.project_id}/documents`);
  }
  return { success: true };
}

export async function uploadDocumentFile(
  documentId: string,
  file: File
) {
  const document = await db.documents.get(documentId);
  if (!document) {
    return { error: "Document not found" };
  }

  const supabase = await createClient();

  const filePath = `${document.tenant_id}/${documentId}/${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const updatedDoc = await db.documents.update(documentId, {
    file_path: filePath,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type
  });

  if (document.project_id) {
    revalidatePath(`/projects/${document.project_id}/documents`);
  }
  return { document: updatedDoc };
}

export async function getDocumentDownloadUrl(id: string) {
  const document = await db.documents.get(id);
  if (!document || !document.file_path) {
    return { error: "Document not found or no file attached" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(document.file_path, 3600);

  if (error) {
    return { error: `Failed to get download URL: ${error.message}` };
  }

  return { url: data.signedUrl };
}
