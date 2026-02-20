"use client";

export const dynamic = "force-dynamic";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useState, useRef, useEffect } from "react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SobekMascot } from "@/components/SobekMascot";
import { Header } from "@/components/header";
import { TelegramDebug } from "@/components/telegram-debug";

interface Message {
  role: "user" | "agent";
  text: string;
}

const AGENT_ID = "agent_7901khta30m9ehv9b3d5jvdx1qmh";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [muted, setMuted] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  useWalletAuth();

  const conversation = useConversation({
    micMuted: muted,
    clientTools: {
      get_tasks: async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("tasks")
            .select("title, description, price_usdc, status, users:agent_id(display_name, telegram_handle)")
            .order("created_at", { ascending: false });

          if (error) return "Sorry, I couldn't fetch the tasks right now.";
          if (!data || data.length === 0) return "There are no tasks available right now.";

          const lines = data.map((t) => {
            const user = t.users as { display_name: string | null; telegram_handle: string | null } | null;
            const creator = user?.display_name || user?.telegram_handle || "Anonymous";
            return `${t.title} — ${t.description}. Price: $${t.price_usdc} USDC. Status: ${t.status}. Posted by ${creator}.`;
          });
          return `There are ${data.length} tasks available:\n${lines.join("\n")}`;
        } catch {
          return "Sorry, something went wrong fetching tasks.";
        }
      },
    },
    onMessage: ({ message, role }) => {
      setMessages((prev) => [...prev, { role, text: message }]);
    },
    onError: (message) => {
      console.error("Error:", message);
    },
  });

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStart = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({ agentId: AGENT_ID } as Parameters<
        typeof conversation.startSession
      >[0]);
    } catch (err) {
      console.error("Failed to start:", err);
    }
  }, [conversation]);

  const handleEnd = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0a0f0a] text-white font-sans">
      <Header />

      {/* Mascot */}
      <div className="mt-8 mb-4">
        <SobekMascot />
      </div>

      {/* Hero */}
      <div className="mb-16 max-w-lg text-center space-y-4 px-4">
        <h1 className="text-5xl font-bold tracking-tight text-emerald-400">
          Sobek
        </h1>
        <p className="text-lg text-emerald-300/60">
          Voice-powered task marketplace. Powered by Base, Hedera, and x402.
        </p>
        <p className="text-sm text-emerald-200/40 leading-relaxed">
          Create tasks, set a price in USDC, and let task runners compete to
          fulfill them. No account needed — just connect your wallet and pay.
          Every transaction is onchain.
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link href="/task">
            <Button size="lg">Earn USDC</Button>
          </Link>
        </div>
      </div>

      {/* Demo */}
      <div className="flex flex-col items-center gap-8">
        {/* Orb */}
        <div
          className={`orb ${conversation.isSpeaking ? "orb-speaking" : ""} ${isConnected ? "orb-connected" : ""}`}
        />

        {/* Status */}
        <p className="text-sm text-emerald-300/50">
          {conversation.status === "disconnected" && "Ready"}
          {isConnecting && "Connecting..."}
          {isConnected &&
            (conversation.isSpeaking ? "Agent speaking" : muted ? "Muted" : "Listening")}
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={isConnected ? handleEnd : handleStart}
            disabled={isConnecting}
            variant={isConnected ? "destructive" : "default"}
            size="lg"
            className="rounded-full px-8"
          >
            {isConnecting
              ? "Connecting..."
              : isConnected
                ? "End Call"
                : "Start Call"}
          </Button>
          {isConnected && (
            <Button
              onClick={() => setMuted((m) => !m)}
              variant="outline"
              size="lg"
              className="rounded-full px-6"
            >
              {muted ? "Unmute" : "Mute"}
            </Button>
          )}
        </div>

        {/* Transcript */}
        {messages.length > 0 && (
          <div
            ref={transcriptRef}
            className="w-full max-w-md max-h-64 overflow-y-auto rounded-lg bg-emerald-950/50 border border-emerald-900/30 p-4 space-y-2"
          >
            {messages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span
                  className={
                    msg.role === "agent"
                      ? "text-emerald-400"
                      : "text-emerald-200/50"
                  }
                >
                  {msg.role === "agent" ? "Sobek" : "You"}:
                </span>{" "}
                <span className="text-emerald-100/80">{msg.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <TelegramDebug />
    </div>
  );
}
