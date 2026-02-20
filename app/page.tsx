"use client";

export const dynamic = "force-dynamic";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useState, useRef, useEffect } from "react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { SobekMascot } from "@/components/SobekMascot";
import { Header } from "@/components/header";
import {
  getAccount,
  writeContract,
  sendTransaction,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { parseUnits, parseEther, erc20Abi } from "viem";
import { wagmiConfig } from "@/config/wagmi";
import { BASE_USDC_ADDRESS, ETH_USD_PRICE } from "@/config/constants";
import { createOrder } from "@/app/task/actions";


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
            .select("id, title, description, price_usdc, status, users:agent_id(display_name, telegram_handle)")
            .order("created_at", { ascending: false });

          if (error) return "Sorry, I couldn't fetch the tasks right now.";
          if (!data || data.length === 0) return "There are no tasks available right now.";

          const lines = data.map((t) => {
            const user = t.users as { display_name: string | null; telegram_handle: string | null } | null;
            const creator = user?.display_name || user?.telegram_handle || "Anonymous";
            return `[Task ID: ${t.id}] ${t.title} — ${t.description}. Price: $${t.price_usdc} USDC. Status: ${t.status}. Posted by ${creator}.`;
          });
          return `There are ${data.length} tasks available:\n${lines.join("\n")}`;
        } catch {
          return "Sorry, something went wrong fetching tasks.";
        }
      },
      initiate_payment: async ({ task_id, payment_method }: { task_id: string; payment_method: "usdc" | "native" }) => {
        try {
          // Check wallet connection
          const account = getAccount(wagmiConfig);
          if (!account.isConnected || !account.address) {
            return "The user's wallet is not connected. Please ask them to connect their wallet first using the button on the page.";
          }

          // Fetch task details including recipient wallet
          const supabase = createClient();
          const { data: task, error: taskError } = await supabase
            .from("tasks")
            .select("id, title, price_usdc, users:agent_id(wallet_address)")
            .eq("id", task_id)
            .single();

          if (taskError || !task) {
            return "I couldn't find that task. It may have been removed.";
          }

          const user = task.users as { wallet_address: string } | null;
          if (!user?.wallet_address) {
            return "The task provider hasn't set up a wallet address to receive payments.";
          }

          const recipientAddress = user.wallet_address as `0x${string}`;
          const priceUsdc = task.price_usdc;
          let txHash: `0x${string}`;

          if (payment_method === "usdc") {
            txHash = await writeContract(wagmiConfig, {
              address: BASE_USDC_ADDRESS,
              abi: erc20Abi,
              functionName: "transfer",
              args: [recipientAddress, parseUnits(priceUsdc.toString(), 6)],
            });
          } else {
            const ethAmount = priceUsdc / ETH_USD_PRICE;
            txHash = await sendTransaction(wagmiConfig, {
              to: recipientAddress,
              value: parseEther(ethAmount.toFixed(18)),
            });
          }

          // Wait for on-chain confirmation
          await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

          // Record the order
          const currency = payment_method === "usdc" ? "USDC" : "ETH";
          const orderResult = await createOrder(task_id, txHash, currency);

          if (orderResult.error) {
            return `Payment went through on-chain (tx: ${txHash}), but there was an issue recording the order: ${orderResult.error.message}. The provider will still receive the funds.`;
          }

          return `Payment successful! The order for "${task.title}" has been placed. Transaction hash: ${txHash}.`;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message.split("\n")[0] : "Unknown error";
          return `Payment failed: ${message}. The user may have rejected the transaction or there was a network issue.`;
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
        <h1 className="text-5xl font-bold tracking-tight text-sobek-gold">
          Sobek
        </h1>
        <p className="text-lg text-sobek-green-light/80">
          Voice-powered task marketplace.
        </p>

        {/* Built on */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <span className="text-xs uppercase tracking-widest text-sobek-green-light/50">
            Built on
          </span>
          <div className="flex items-center gap-5">
            <Image src="/base-logo.svg" alt="Base" width={28} height={28} className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity" />
            <Image src="/hedera-logo.svg" alt="Hedera" width={28} height={28} className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity" />
            <Image src="/adi-logo.svg" alt="ADI" width={82} height={28} className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <p className="text-sm text-sobek-green-light/80 leading-relaxed">
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
        <button
          onClick={isConnected ? handleEnd : handleStart}
          disabled={isConnecting}
          className={`orb relative z-10 ${conversation.isSpeaking ? "orb-speaking" : ""} ${isConnected ? "orb-connected" : ""} ${isConnecting ? "opacity-60" : ""}`}
        />

        {/* Status */}
        <p className="text-lg text-sobek-green-light/80">
          {conversation.status === "disconnected" && "Click the orb to start."}
          {isConnecting && "Connecting..."}
          {isConnected &&
            (conversation.isSpeaking ? "Agent speaking" : muted ? "Muted" : "Listening")}
        </p>

        {isConnected && (
          <div className="flex items-center gap-3">
            <Button
              onClick={handleEnd}
              variant="destructive"
              size="lg"
              className="rounded-full px-8"
            >
              End Call
            </Button>
            <Button
              onClick={() => setMuted((m) => !m)}
              variant="outline"
              size="lg"
              className="rounded-full px-6"
            >
              {muted ? "Unmute" : "Mute"}
            </Button>
          </div>
        )}

        {/* Transcript */}
        {messages.length > 0 && (
          <div
            ref={transcriptRef}
            className="w-full max-w-md max-h-64 overflow-y-auto rounded-lg bg-sobek-forest/50 border border-sobek-forest/30 p-4 space-y-2"
          >
            {messages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span
                  className={
                    msg.role === "agent"
                      ? "text-sobek-gold"
                      : "text-sobek-green/50"
                  }
                >
                  {msg.role === "agent" ? "Sobek" : "You"}:
                </span>{" "}
                <span className="text-sobek-green/80">{msg.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
