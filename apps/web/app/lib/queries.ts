import { api } from "./api";

export type ApiList<T> = {
  items: T[];
};

export type ApiItem<T> = {
  item: T;
};

export type InstanceSummary = {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  subscription_tier?: string;
};

export type ProgramSummary = {
  id: string;
  name: string;
  status?: string;
  description?: string | null;
  created_at: string;
  total_budget?: string | null;
  spent_budget?: string | null;
  currency?: string | null;
};

export type BudgetSummary = {
  id: string;
  name: string;
  status: string;
  total_amount?: number | null;
  fiscal_year?: string | null;
  currency?: string | null;
  created_at: string;
};

export type EventSummary = {
  id: string;
  name: string;
  status: string;
  type: string;
  start_at?: string | null;
  end_at?: string | null;
  location?: string | null;
  created_at: string;
};

export type SurveySummary = {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  created_at: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  created_at: string;
};

export const getInstances = async () => {
  return api.get<ApiList<InstanceSummary>>("/api/v1/instances");
};

export const getPrograms = async () => {
  return api.get<ApiList<ProgramSummary>>("/api/v1/programs");
};

export const getProgram = async (id: string) => {
  return api.get<ApiItem<ProgramSummary>>(`/api/v1/programs/${id}`);
};

export const getEvents = async (programId?: string) => {
  const url = programId ? `/api/v1/events?program_id=${programId}` : "/api/v1/events";
  return api.get<ApiList<EventSummary>>(url);
};

export const getBudgets = async (programId?: string) => {
  const url = programId ? `/api/v1/budgets?program_id=${programId}` : "/api/v1/budgets";
  return api.get<ApiList<BudgetSummary>>(url);
};

export const getProfiles = async () => {
  return api.get<ApiList<Record<string, unknown>>>("/api/v1/profiles");
};

export const getPipelines = async () => {
  return api.get<ApiList<Record<string, unknown>>>("/api/v1/pipelines");
};

export const getSurveys = async (programId?: string) => {
  const url = programId ? `/api/v1/surveys?program_id=${programId}` : "/api/v1/surveys";
  return api.get<ApiList<SurveySummary>>(url);
};

export const getKpis = async () => {
  return api.get<ApiList<Record<string, unknown>>>("/api/v1/kpis");
};

export const getProjects = async (programId?: string) => {
  const url = programId ? `/api/v1/projects?program_id=${programId}` : "/api/v1/projects";
  return api.get<ApiList<ProjectSummary>>(url);
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
  return api.get<ApiItem<InstanceBranding>>(`/api/v1/instances/${instanceId}/branding`);
};

export const updateInstanceBranding = async (instanceId: string, data: Partial<InstanceBranding>) => {
  return api.patch<ApiItem<InstanceBranding>>(`/api/v1/instances/${instanceId}/branding`, data);
};
