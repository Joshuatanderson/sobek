import { supabaseAdmin } from "./supabase/admin";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

/** Send a raw Telegram message to a chat ID. */
export async function sendTelegramMessage(
  chatId: number,
  text: string
): Promise<boolean> {
  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    }
  );
  return res.ok;
}

/** Send a Telegram message to a user by Supabase user ID. Returns false if not linked. */
export async function notifyUser(
  userId: string,
  message: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("telegram_chat_id")
    .eq("id", userId)
    .single();

  if (!data?.telegram_chat_id) return false;
  return sendTelegramMessage(data.telegram_chat_id, message);
}

/** Send a Telegram message to a user by wallet address. Returns false if not linked. */
export async function notifyWallet(
  walletAddress: string,
  message: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("telegram_chat_id")
    .eq("wallet_address", walletAddress)
    .single();

  if (!data?.telegram_chat_id) return false;
  return sendTelegramMessage(data.telegram_chat_id, message);
}
