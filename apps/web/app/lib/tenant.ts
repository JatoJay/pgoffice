import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "pgm_tenant";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeTenant = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return UUID_REGEX.test(trimmed) ? trimmed : null;
};

export async function resolveActiveTenantId(): Promise<string> {
  const tenant = await getActiveTenantId();
  if (!tenant) {
    throw new Error("Active instance not set. Run onboarding or set an instance in /instances.");
  }
  return tenant;
}

export async function getActiveTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieTenant = normalizeTenant(cookieStore.get(COOKIE_NAME)?.value);
  const envTenant = normalizeTenant(process.env.NEXT_PUBLIC_TENANT_ID);

  return cookieTenant || envTenant || null;
}
