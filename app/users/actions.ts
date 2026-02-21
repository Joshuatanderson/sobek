"use server";

import { createClient } from "@/utils/supabase/server";

export async function getUsers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("wallet_address, display_name, erc8004_agent_id, reputation_sum")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}
