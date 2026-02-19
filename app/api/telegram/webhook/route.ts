import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { sendTelegramMessage } from "@/utils/telegram";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: true });
  }

  const body = await req.json();
  const message = body?.message;
  if (!message?.text?.startsWith("/start ")) {
    return NextResponse.json({ ok: true });
  }

  const token = message.text.slice("/start ".length).trim();
  if (!token) return NextResponse.json({ ok: true });

  const chatId: number = message.chat.id;
  const handle: string | undefined = message.from?.username;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, wallet_address")
    .eq("telegram_link_token", token)
    .single();

  if (!user) {
    await sendTelegramMessage(chatId, "Link token not found or expired.");
    return NextResponse.json({ ok: true });
  }

  await supabaseAdmin
    .from("users")
    .update({
      telegram_chat_id: chatId,
      telegram_handle: handle ?? null,
      telegram_link_token: null,
    })
    .eq("id", user.id);

  const short = `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`;
  await sendTelegramMessage(chatId, `Linked to wallet ${short}`);

  return NextResponse.json({ ok: true });
}
