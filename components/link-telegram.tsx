"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { generateTelegramLink, unlinkTelegram } from "@/app/telegram/actions";
import { createClient } from "@/utils/supabase/client";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

const supabase = createClient();

export function LinkTelegram() {
  const { isConnected } = useAccount();
  const [handle, setHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("telegram_handle, telegram_chat_id")
      .eq("id", user.id)
      .single();
    if (data?.telegram_chat_id) {
      setHandle(data.telegram_handle ?? "linked");
      // Stop polling once linked
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setHandle(null);
      return;
    }

    fetchStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) fetchStatus();
      if (event === "SIGNED_OUT") setHandle(null);
    });

    return () => {
      subscription.unsubscribe();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isConnected, fetchStatus]);

  if (!isConnected) return null;

  async function handleLink() {
    setLoading(true);
    const { url } = await generateTelegramLink();
    if (url) {
      window.open(url, "_blank");
      // Poll every 2s until the webhook writes telegram_chat_id
      pollRef.current = setInterval(fetchStatus, 2000);
    }
    setLoading(false);
  }

  async function handleUnlink() {
    setLoading(true);
    const { error } = await unlinkTelegram();
    if (!error) setHandle(null);
    setLoading(false);
  }

  if (handle) {
    return (
      <button
        onClick={handleUnlink}
        disabled={loading}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-50"
        title="Click to unlink"
      >
        <TelegramIcon className="size-4 text-[#2AABEE]" />
        <span className="text-sm text-emerald-300/80">
          @{handle === "linked" ? "connected" : handle}
        </span>
      </button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLink} disabled={loading}>
      <TelegramIcon className="size-4" />
      Link Telegram
    </Button>
  );
}
