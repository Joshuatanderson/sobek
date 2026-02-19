"use server";

import { randomBytes } from "crypto";
import { createClient } from "@/utils/supabase/server";
import { env } from "@/config/env";

export async function generateTelegramLink() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { url: null, error: "Not authenticated" };
  }

  const token = randomBytes(32).toString("hex");

  const { error } = await supabase
    .from("users")
    .update({ telegram_link_token: token })
    .eq("id", user.id);

  if (error) {
    return { url: null, error: error.message };
  }

  const botUsername = env.TELEGRAM_BOT_USERNAME;
  return { url: `https://t.me/${botUsername}?start=${token}`, error: null };
}

export async function unlinkTelegram() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("users")
    .update({
      telegram_chat_id: null,
      telegram_handle: null,
      telegram_link_token: null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
