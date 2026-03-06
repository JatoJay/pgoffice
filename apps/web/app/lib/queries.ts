import { db } from "./supabase/db";

export type ApiList<T> = {
  items: T[];
};

export type ApiItem<T> = {
  item: T;
};

export type InstanceSummary = {
  id: string;
  name: string;
  slug?: string | null;
  status?: string;
  subscription_tier?: string | null;
};

export type ProgramSummary = {
  id: string;
  name: string;
  status?: string;
  description?: string | null;
  created_at: string;
  total_budget?: number | null;
  spent_budget?: number | null;
  currency?: string | null;
};

export type ProjectSummary = {
  id: string;
  name: string;
  status: string | null;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  created_at: string;
};

export const getInstances = async () => {
  try {
    const items = await db.instances.list();
    return { data: { items }, error: undefined };
  } catch (e) {
    return { data: { items: [] }, error: e instanceof Error ? e.message : "Failed to fetch" };
  }
};

export const getPrograms = async () => {
  try {
    const items = await db.programs.list();
    return { data: { items }, error: undefined };
  } catch (e) {
    return { data: { items: [] }, error: e instanceof Error ? e.message : "Failed to fetch" };
  }
};

export const getProgram = async (id: string) => {
  try {
    const item = await db.programs.get(id);
    if (!item) {
      return { data: { item: null }, error: "Program not found" };
    }
    return { data: { item }, error: undefined };
  } catch (e) {
    return { data: { item: null }, error: e instanceof Error ? e.message : "Failed to fetch" };
  }
};

export const getProjects = async (instanceId?: string) => {
  try {
    const items = await db.projects.list(instanceId);
    return { data: { items }, error: undefined };
  } catch (e) {
    return { data: { items: [] }, error: e instanceof Error ? e.message : "Failed to fetch" };
  }
};

export type InstanceBranding = {
  id?: string;
  tenant_id: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  domain?: string | null;
};

export const getInstanceBranding = async (instanceId: string) => {
  try {
    const item = await db.instances.getBranding(instanceId);
    if (!item) {
      return { data: { item: { tenant_id: instanceId } as InstanceBranding }, error: undefined };
    }
    return { data: { item }, error: undefined };
  } catch (e) {
    return { data: { item: { tenant_id: instanceId } as InstanceBranding }, error: e instanceof Error ? e.message : "Failed to fetch" };
  }
};

export const updateInstanceBranding = async (instanceId: string, data: Partial<InstanceBranding>) => {
  try {
    const item = await db.instances.updateBranding(instanceId, data);
    return { data: { item }, error: undefined };
  } catch (e) {
    return { data: { item: null }, error: e instanceof Error ? e.message : "Failed to update" };
  }
};
