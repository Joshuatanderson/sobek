"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

const supabase = createClient();

export function TelegramDebug() {
  const { isConnected } = useAccount();
  const [webhookInfo, setWebhookInfo] = useState<Record<string, unknown> | null>(null);
  const [userRow, setUserRow] = useState<Record<string, unknown> | null>(null);
  const [settingWebhook, setSettingWebhook] = useState(false);

  async function fetchWebhookInfo() {
    try {
      const res = await fetch("/api/telegram/debug");
      const text = await res.text();
      if (!text) { setWebhookInfo({ error: "Empty response" }); return; }
      const data = JSON.parse(text);
      setWebhookInfo(data.result ?? data);
    } catch (e) {
      setWebhookInfo({ error: String(e) });
    }
  }

  async function fetchUserRow() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUserRow({ error: "Not authenticated with Supabase" });
      return;
    }
    const { data, error } = await supabase
      .from("users")
      .select("id, wallet_address, telegram_chat_id, telegram_handle, telegram_link_token")
      .eq("id", user.id)
      .single();
    setUserRow(error ? { error: error.message } : data);
  }

  async function handleSetWebhook() {
    setSettingWebhook(true);
    try {
      const res = await fetch("/api/telegram/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set" }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : { error: "Empty response" };
      setWebhookInfo(data);
    } catch (e) {
      setWebhookInfo({ error: String(e) });
    }
    setSettingWebhook(false);
  }

  useEffect(() => {
    fetchWebhookInfo();
  }, []);

  useEffect(() => {
    if (isConnected) fetchUserRow();
  }, [isConnected]);

  const webhookUrl = (webhookInfo as Record<string, unknown>)?.url as string | undefined;
  const hasWebhook = webhookUrl && webhookUrl.length > 0;

  return (
    <div className="fixed bottom-4 right-4 w-96 rounded-lg bg-gray-900 border border-sobek-forest/50 p-4 text-xs font-mono text-sobek-green-light/80 space-y-3 z-50">
      <div className="flex items-center justify-between">
        <span className="text-sobek-gold font-bold text-sm">Telegram Debug</span>
        <Button variant="link" size="xs" onClick={() => { fetchWebhookInfo(); fetchUserRow(); }} className="text-sobek-green hover:text-sobek-green-light">
          refresh
        </Button>
      </div>

      <div className="space-y-1">
        <div className="text-sobek-green-light/60">Webhook:</div>
        {hasWebhook ? (
          <div className="text-green-400 break-all">{webhookUrl}</div>
        ) : (
          <div className="space-y-1">
            <div className="text-red-400">Not configured</div>
            <Button size="xs" onClick={handleSetWebhook} disabled={settingWebhook}>
              {settingWebhook ? "Setting..." : "Register webhook now"}
            </Button>
          </div>
        )}
        {webhookInfo && (
          <pre className="mt-1 text-[10px] text-sobek-green-light/40 overflow-auto max-h-24">
            {JSON.stringify(webhookInfo, null, 2)}
          </pre>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-sobek-green-light/60">User DB row:</div>
        {userRow ? (
          <pre className="text-[10px] overflow-auto max-h-24">
            {JSON.stringify(userRow, null, 2)}
          </pre>
        ) : (
          <div className="text-yellow-400">Connect wallet first</div>
        )}
      </div>
    </div>
  );
}
