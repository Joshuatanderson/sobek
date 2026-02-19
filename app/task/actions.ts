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

  return { data: result.data, error: result.error };
}
