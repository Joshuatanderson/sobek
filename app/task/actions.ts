"use server";

import { createClient } from "@/utils/supabase/server";

export async function createTask(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: { message: "Not authenticated" } };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priceRaw = formData.get("price_usdc") as string;
  const price_usdc = parseFloat(priceRaw);

  if (!title || !description || isNaN(price_usdc)) {
    return { data: null, error: { message: "Missing required fields" } };
  }

  const result = await supabase.from("tasks").insert({
    title,
    description,
    price_usdc,
    agent_id: user.id,
  }).select();

  if (result.error?.code === "23503") {
    return { data: null, error: { message: "User profile not found. Please reconnect your wallet." } };
  }

  return { data: result.data, error: result.error };
}

export async function getTasks() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, description, price_usdc, status, users:agent_id(display_name, telegram_handle, wallet_address)")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}
