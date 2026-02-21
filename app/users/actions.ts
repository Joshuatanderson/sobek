"use server";

import { supabaseAdmin } from "@/utils/supabase/admin";

export async function getUsers() {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("wallet_address, display_name, erc8004_agent_id, reputation_score")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getUsers] Supabase error:", error.message);
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}
