"use server";

import { cookies } from "next/headers";
import { createClient } from "@/app/lib/supabase/server";

export async function ensureDefaultInstance(userId: string, userEmail: string) {
  const supabase = await createClient();

  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", `user-${userId}`)
    .single();

  let orgId: string;

  if (existingOrg) {
    orgId = existingOrg.id;
  } else {
    const { data: newOrg, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: userEmail.split("@")[0] || "My Organization",
        slug: `user-${userId}`
      })
      .select()
      .single();

    if (orgError) {
      console.error("[INSTANCE] Failed to create org:", orgError);
      return null;
    }
    orgId = newOrg.id;
  }

  const { data: existingInstance } = await supabase
    .from("instances")
    .select("id")
    .eq("organization_id", orgId)
    .single();

  if (existingInstance) {
    const cookieStore = await cookies();
    cookieStore.set("pgm_tenant", existingInstance.id, { path: "/", sameSite: "lax" });
    return existingInstance.id;
  }

  const { data: newInstance, error: instanceError } = await supabase
    .from("instances")
    .insert({
      organization_id: orgId,
      name: "Default Instance",
      slug: `instance-${userId}`,
      status: "active",
      subscription_tier: "starter"
    })
    .select()
    .single();

  if (instanceError) {
    console.error("[INSTANCE] Failed to create instance:", instanceError);
    return null;
  }

  const cookieStore = await cookies();
  cookieStore.set("pgm_tenant", newInstance.id, { path: "/", sameSite: "lax" });
  return newInstance.id;
}

export async function createInstance(data: { name: string; slug: string }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", `user-${user.id}`)
    .single();

  if (!org) {
    return { error: "Organization not found" };
  }

  const { data: existing } = await supabase
    .from("instances")
    .select("id")
    .eq("slug", data.slug)
    .single();

  if (existing) {
    return { error: "Instance with this slug already exists" };
  }

  const { data: newInstance, error } = await supabase
    .from("instances")
    .insert({
      organization_id: org.id,
      name: data.name,
      slug: data.slug,
      status: "active",
      subscription_tier: "starter"
    })
    .select()
    .single();

  if (error) {
    console.error("[INSTANCE] Failed to create instance:", error);
    return { error: error.message };
  }

  const cookieStore = await cookies();
  cookieStore.set("pgm_tenant", newInstance.id, { path: "/", sameSite: "lax" });
  return { instance: newInstance };
}

export async function getInstances() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated", instances: [] };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", `user-${user.id}`)
    .single();

  if (!org) {
    return { error: "Organization not found", instances: [] };
  }

  const { data: instances, error } = await supabase
    .from("instances")
    .select("id, name, slug, status")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message, instances: [] };
  }

  return { instances: instances || [] };
}

export async function switchInstance(instanceId: string) {
  const cookieStore = await cookies();
  cookieStore.set("pgm_tenant", instanceId, { path: "/", sameSite: "lax" });
  return { success: true };
}
