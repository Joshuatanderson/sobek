import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { sendTelegramMessage } from "@/utils/telegram";
import { env } from "@/config/env";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-telegram-bot-api-secret-token");
    console.log("[telegram-webhook] Hit! Secret:", secret ? "present" : "missing");

    if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      console.log("[telegram-webhook] Secret mismatch");
      return NextResponse.json({ ok: true });
    }

    const body = await req.json();
    console.log("[telegram-webhook] Body:", JSON.stringify(body, null, 2));

    const message = body?.message;
    if (!message?.text?.startsWith("/start ")) {
      console.log("[telegram-webhook] Not a /start command, text:", message?.text);
      return NextResponse.json({ ok: true });
    }

    const token = message.text.slice("/start ".length).trim();
    if (!token) {
      console.log("[telegram-webhook] Empty token after /start");
      return NextResponse.json({ ok: true });
    }

    const chatId: number = message.chat.id;
    const handle: string | undefined = message.from?.username;
    console.log("[telegram-webhook] chatId:", chatId, "handle:", handle, "token:", token.slice(0, 8) + "...");

    const { data: user, error: lookupError } = await supabaseAdmin
      .from("users")
      .select("id, wallet_address")
      .eq("telegram_link_token", token)
      .single();

    console.log("[telegram-webhook] Lookup:", { user: user?.id, error: lookupError?.message });

    if (!user) {
      await sendTelegramMessage(chatId, "Link token not found or expired.");
      return NextResponse.json({ ok: true });
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        telegram_chat_id: chatId,
        telegram_handle: handle ?? null,
        telegram_link_token: null,
      })
      .eq("id", user.id);

    console.log("[telegram-webhook] Update:", { error: updateError?.message });

    const short = `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`;
    await sendTelegramMessage(chatId, `Linked to wallet ${short}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram-webhook] CRASH:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 200 });
  }
}
