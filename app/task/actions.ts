"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { notifyUser } from "@/utils/telegram";
import { revalidatePath } from "next/cache";

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

export async function createOrder(taskId: string, txHash: string, paymentCurrency: string = "USDC") {
  // Look up task to get provider's agent_id and details
  const { data: task, error: taskError } = await supabaseAdmin
    .from("tasks")
    .select("id, title, price_usdc, agent_id")
    .eq("id", taskId)
    .single();

  if (taskError || !task) {
    return { data: null, error: { message: "Task not found" } };
  }

  // Insert order
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      task_id: taskId,
      tx_hash: txHash,
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError) {
    return { data: null, error: { message: orderError.message } };
  }

  // Notify provider via Telegram
  if (task.agent_id) {
    await notifyUser(
      task.agent_id,
      `New order for "${task.title}" (${paymentCurrency === "USDC" ? "$" : ""}${task.price_usdc} ${paymentCurrency}). Tx: ${txHash}`
    );
  }

  revalidatePath("/task");
  return { data: order, error: null };
}
