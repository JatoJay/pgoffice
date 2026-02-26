"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "../lib/api";

export async function createOnboarding(formData: FormData) {
  const payload = {
    organization_name: String(formData.get("organization_name") || ""),
    organization_slug: String(formData.get("organization_slug") || ""),
    instance_name: String(formData.get("instance_name") || ""),
    instance_slug: String(formData.get("instance_slug") || ""),
    subscription_tier: String(formData.get("subscription_tier") || "starter"),
    seat_limit: Number(formData.get("seat_limit") || 50),
    user_limit: Number(formData.get("user_limit") || 50),
    program_name: String(formData.get("program_name") || ""),
    admin_email: String(formData.get("admin_email") || ""),
    admin_name: String(formData.get("admin_name") || "")
  };

  const { data, error } = await api.post<{ item: { instance?: { id?: string } } }>(
    "/api/v1/onboarding",
    payload
  );

  if (error) {
    throw new Error(error);
  }

  const instanceId = data?.item?.instance?.id;
  if (instanceId) {
    const cookieStore = await cookies();
    cookieStore.set("pgm_tenant", instanceId, { path: "/", sameSite: "lax" });
  }

  redirect("/programs");
}
