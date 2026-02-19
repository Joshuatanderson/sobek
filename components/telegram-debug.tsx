"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export function TelegramDebug() {
  const { isConnected } = useAccount();
  const [webhookInfo, setWebhookInfo] = useState<Record<string, unknown> | null>(null);
  const [userRow, setUserRow] = useState<Record<string, unknown> | null>(null);
  const [settingWebhook, setSettingWebhook] = useState(false);

  async function fetchWebhookInfo() {
    const res = await fetch("/api/telegram/debug");
    const data = await res.json();
    setWebhookInfo(data.result ?? data);
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
    const res = await fetch("/api/telegram/debug", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set" }),
    });
    const data = await res.json();
    setWebhookInfo(data);
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
    <div className="fixed bottom-4 right-4 w-96 rounded-lg bg-gray-900 border border-emerald-900/50 p-4 text-xs font-mono text-emerald-200/80 space-y-3 z-50">
      <div className="flex items-center justify-between">
        <span className="text-emerald-400 font-bold text-sm">Telegram Debug</span>
        <button onClick={() => { fetchWebhookInfo(); fetchUserRow(); }} className="text-emerald-500 hover:text-emerald-300">
          refresh
        </button>
      </div>

      <div className="space-y-1">
        <div className="text-emerald-400/60">Webhook:</div>
        {hasWebhook ? (
          <div className="text-green-400 break-all">{webhookUrl}</div>
        ) : (
          <div className="space-y-1">
            <div className="text-red-400">Not configured</div>
            <button
              onClick={handleSetWebhook}
              disabled={settingWebhook}
              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-white disabled:opacity-50"
            >
              {settingWebhook ? "Setting..." : "Register webhook now"}
            </button>
          </div>
        )}
        {webhookInfo && (
          <pre className="mt-1 text-[10px] text-emerald-200/40 overflow-auto max-h-24">
            {JSON.stringify(webhookInfo, null, 2)}
          </pre>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-emerald-400/60">User DB row:</div>
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
