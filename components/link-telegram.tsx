"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { generateTelegramLink, unlinkTelegram } from "@/app/telegram/actions";
import { useAuth } from "@/contexts/auth-context";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function LinkTelegram() {
  const { isConnected, userProfile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollForLink = useCallback(async () => {
    await refreshProfile();
  }, [refreshProfile]);

  if (!isConnected) return null;

  const handle = userProfile?.telegram_chat_id
    ? userProfile.telegram_handle ?? "linked"
    : null;

  // Stop polling once linked
  if (handle && pollRef.current) {
    stopPolling();
  }

  async function handleLink() {
    setLoading(true);
    const { url } = await generateTelegramLink();
    if (url) {
      window.open(url, "_blank");
      // Poll every 2s until the webhook writes telegram_chat_id
      pollRef.current = setInterval(pollForLink, 2000);
    }
    setLoading(false);
  }

  async function handleUnlink() {
    setLoading(true);
    const { error } = await unlinkTelegram();
    if (!error) await refreshProfile();
    setLoading(false);
  }

  if (handle) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleUnlink}
        disabled={loading}
        className="rounded-full gap-2 hover:bg-sobek-forest/50"
        title="Click to unlink"
      >
        <TelegramIcon className="size-4 text-[#2AABEE]" />
        <span className="text-sm text-sobek-green/80">
          @{handle === "linked" ? "connected" : handle}
        </span>
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLink} disabled={loading}>
      <TelegramIcon className="size-4" />
      Link Telegram
    </Button>
  );
}
