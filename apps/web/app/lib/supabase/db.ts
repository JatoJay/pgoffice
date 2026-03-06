import "server-only";
import { createClient } from "./server";
import type { Database, Tables, InsertTables, UpdateTables } from "./types";

export type { Tables, InsertTables, UpdateTables };

async function getSupabase() {
  return createClient();
}

async function getTenantId(): Promise<string | null> {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.tenant_id || null;
}

export const db = {
  instances: {
    async list() {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("instances")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tables<"instances">[];
    },

    async get(id: string) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("instances")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data as Tables<"instances">;
    },

    async create(input: InsertTables<"instances">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("instances")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Tables<"instances">;
    },

    async update(id: string, input: UpdateTables<"instances">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("instances")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) return null;
      return data as Tables<"instances">;
    },

    async getBranding(tenantId: string) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("instance_branding")
        .select("*")
        .eq("tenant_id", tenantId)
        .single();
      if (error) return null;
      return data as Tables<"instance_branding">;
    },

    async updateBranding(tenantId: string, input: Partial<Tables<"instance_branding">>) {
      const supabase = await getSupabase();
      const { data: existing } = await supabase
        .from("instance_branding")
        .select("id")
        .eq("tenant_id", tenantId)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from("instance_branding")
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq("tenant_id", tenantId)
          .select()
          .single();
        if (error) throw error;
        return data as Tables<"instance_branding">;
      } else {
        const { data, error } = await supabase
          .from("instance_branding")
          .insert({ tenant_id: tenantId, ...input })
          .select()
          .single();
        if (error) throw error;
        return data as Tables<"instance_branding">;
      }
    }
  },

  organizations: {
    async list() {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tables<"organizations">[];
    },

    async get(id: string) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data as Tables<"organizations">;
    },

    async create(input: InsertTables<"organizations">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("organizations")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Tables<"organizations">;
    },

    async update(id: string, input: UpdateTables<"organizations">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("organizations")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) return null;
      return data as Tables<"organizations">;
    }
  },

  projects: {
    async list(instanceId?: string) {
      const supabase = await getSupabase();
      let query = supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (instanceId) {
        query = query.eq("instance_id", instanceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Tables<"projects">[];
    },

    async get(id: string) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data as Tables<"projects">;
    },

    async create(input: InsertTables<"projects">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("projects")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Tables<"projects">;
    },

    async update(id: string, input: UpdateTables<"projects">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("projects")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) return null;
      return data as Tables<"projects">;
    },

    async delete(id: string) {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);
      return !error;
    }
  },

  tasks: {
    async list(projectId?: string) {
      const supabase = await getSupabase();
      let query = supabase
        .from("tasks")
        .select("*")
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Tables<"tasks">[];
    },

    async get(id: string) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data as Tables<"tasks">;
    },

    async create(input: InsertTables<"tasks">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("tasks")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Tables<"tasks">;
    },

    async update(id: string, input: UpdateTables<"tasks">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("tasks")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) return null;
      return data as Tables<"tasks">;
    },

    async delete(id: string) {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);
      return !error;
    }
  },

  budgetItems: {
    async list(projectId: string) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("project_budget_items")
        .select("*")
        .eq("project_id", projectId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Tables<"project_budget_items">[];
    },

    async create(input: InsertTables<"project_budget_items">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("project_budget_items")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Tables<"project_budget_items">;
    },

    async update(id: string, input: UpdateTables<"project_budget_items">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("project_budget_items")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) return null;
      return data as Tables<"project_budget_items">;
    },

    async delete(id: string) {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("project_budget_items")
        .delete()
        .eq("id", id);
      return !error;
    }
  },

  documents: {
    async list(projectId: string) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tables<"documents">[];
    },

    async get(id: string) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data as Tables<"documents">;
    },

    async create(input: InsertTables<"documents">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("documents")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Tables<"documents">;
    },

    async update(id: string, input: UpdateTables<"documents">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("documents")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) return null;
      return data as Tables<"documents">;
    },

    async delete(id: string) {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);
      return !error;
    }
  },

  taskAccessTokens: {
    async getByToken(token: string) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("task_access_tokens")
        .select("*")
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .single();
      if (error) return null;
      return data as Tables<"task_access_tokens">;
    },

    async create(input: InsertTables<"task_access_tokens">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("task_access_tokens")
        .upsert(input, { onConflict: "task_id,email" })
        .select()
        .single();
      if (error) throw error;
      return data as Tables<"task_access_tokens">;
    },

    async updateLastUsed(id: string) {
      const supabase = await getSupabase();
      await supabase
        .from("task_access_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", id);
    }
  },

  taskComments: {
    async list(taskId: string) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Tables<"task_comments">[];
    },

    async create(input: InsertTables<"task_comments">) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("task_comments")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Tables<"task_comments">;
    }
  },

  programs: {
    async list() {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tables<"programs">[];
    },

    async get(id: string) {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data as Tables<"programs">;
    }
  }
};
