"use client";

import { useState, useEffect } from "react";
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
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setHandle(null);
      setLinkUrl(null);
      return;
    }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("telegram_handle")
        .eq("id", user.id)
        .single();
      if (data?.telegram_handle) setHandle(data.telegram_handle);
    })();
  }, [isConnected]);

  if (!isConnected) return null;

  async function handleLink() {
    setLoading(true);
    const { url } = await generateTelegramLink();
    if (url) setLinkUrl(url);
    setLoading(false);
  }

  async function handleUnlink() {
    setLoading(true);
    const { error } = await unlinkTelegram();
    if (!error) {
      setHandle(null);
      setLinkUrl(null);
    }
    setLoading(false);
  }

  if (handle) {
    return (
      <div className="flex items-center gap-2">
        <TelegramIcon className="size-4 text-emerald-300/60" />
        <span className="text-sm text-emerald-300/60">@{handle}</span>
        <Button variant="destructive" size="xs" onClick={handleUnlink} disabled={loading}>
          Unlink
        </Button>
      </div>
    );
  }

  if (linkUrl) {
    return (
      <a href={linkUrl} target="_blank" rel="noopener noreferrer">
        <Button
          size="sm"
          className="bg-[#2AABEE] text-white hover:bg-[#229ED9]"
        >
          <TelegramIcon className="size-4" />
          Open in Telegram
        </Button>
      </a>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLink} disabled={loading}>
      <TelegramIcon className="size-4" />
      Link Telegram
    </Button>
  );
}
