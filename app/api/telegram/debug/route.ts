import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";

export async function GET() {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const text = await res.text();
    if (!text) return NextResponse.json({ ok: false, error: "Empty response from Telegram" });
    const info = JSON.parse(text);
    return NextResponse.json(info);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}

export async function POST(req: NextRequest) {
  const { action } = await req.json();

  if (action === "set") {
    const webhookUrl = "https://callsobek.xyz/api/telegram/webhook";
    const res = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: env.TELEGRAM_WEBHOOK_SECRET,
        }),
      }
    );
    const result = await res.json();
    return NextResponse.json({ ...result, webhookUrl });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" });
}
