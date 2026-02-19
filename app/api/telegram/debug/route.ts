import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";

export async function GET() {
  // Check current webhook status
  const res = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`
  );
  const info = await res.json();
  return NextResponse.json(info);
}

export async function POST(req: NextRequest) {
  const { action } = await req.json();

  if (action === "set") {
    // Derive the webhook URL from the request
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "");
    if (!origin) {
      return NextResponse.json({ ok: false, error: "Could not determine origin" });
    }

    const webhookUrl = `${origin}/api/telegram/webhook`;
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
