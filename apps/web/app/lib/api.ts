import "server-only";
import { cookies } from "next/headers";

const BASE_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "";
const USE_AUTH_BYPASS = (process.env.NEXT_PUBLIC_AUTH_BYPASS ?? "true").toLowerCase() === "true";

export type ApiResult<T> = {
  data: T;
  error?: string;
};

const getHeaders = async () => {
  const headerValues: Record<string, string> = {
    "Content-Type": "application/json"
  };

  const cookieStore = await cookies();
  const cookieTenantId = cookieStore.get("pgm_tenant")?.value;
  const tenantId = cookieTenantId || TENANT_ID;

  if (tenantId) {
    headerValues["x-tenant-id"] = tenantId;
  }
  if (USE_AUTH_BYPASS) {
    headerValues["x-super-admin"] = "true";
  }

  const authToken = cookieStore.get("pgm_token")?.value;
  if (authToken) {
    headerValues["Authorization"] = `Bearer ${authToken}`;
  }

  return headerValues;
};

const request = async <T>(path: string, options?: RequestInit): Promise<ApiResult<T>> => {
  try {
    const headerValues = await getHeaders();
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...headerValues,
        ...(options?.headers ?? {})
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        data: null as T,
        error: `Request failed: ${response.status}`
      };
    }

    const data = (await response.json()) as T;
    return { data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return {
      data: null as T,
      error: `API unreachable: ${message}`
    };
  }
};

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE"
    })
};
