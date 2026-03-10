"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { ensureDefaultInstance } from "@/app/actions/instance";

export async function loginAction(formData: FormData) {
  console.log("[LOGIN] NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    console.error("[LOGIN] Failed to create Supabase client:", e);
    redirect(`/login?error=${encodeURIComponent("Failed to initialize auth client")}`);
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  let data, error;
  try {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    data = result.data;
    error = result.error;
  } catch (e) {
    console.error("[LOGIN] Auth error:", e);
    redirect(`/login?error=${encodeURIComponent(e instanceof Error ? e.message : "Authentication failed")}`);
  }

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await ensureDefaultInstance(data.user.id, data.user.email || email);
  }

  redirect("/");
}

export async function registerAction(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) {
    redirect(`/login?mode=register&error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Check your email to confirm your account");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
