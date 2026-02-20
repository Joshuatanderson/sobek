"use server";

import { createClient } from "@/utils/supabase/server";

export async function updateDisplayName(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  const displayName = (formData.get("display_name") as string)?.trim();

  if (!displayName) {
    return { success: false, error: "Display name cannot be empty" };
  }

  const { error } = await supabase
    .from("users")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data } = await supabase
    .from("users")
    .select("display_name, wallet_address")
    .eq("id", user.id)
    .single();

  return data;
}
