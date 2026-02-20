"use client";

export const dynamic = "force-dynamic";

import { useRef, useEffect } from "react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { SobekMascot } from "@/components/SobekMascot";
import { Header } from "@/components/header";
import { useSobekVoice } from "@/hooks/useSobekVoice";

export default function Home() {
  const transcriptRef = useRef<HTMLDivElement>(null);
  useWalletAuth();
  const voice = useSobekVoice();

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [voice.messages]);

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
          onClick={voice.isConnected ? voice.end : voice.start}
          disabled={voice.isConnecting}
          className={`orb relative z-10 ${voice.isSpeaking ? "orb-speaking" : ""} ${voice.isConnected ? "orb-connected" : ""} ${voice.isConnecting ? "opacity-60" : ""}`}
        />

        {/* Status */}
        <p className="text-lg text-sobek-green-light/80">
          {voice.status === "disconnected" && "Click the orb to start."}
          {voice.isConnecting && "Connecting..."}
          {voice.isConnected &&
            (voice.isSpeaking ? "Agent speaking" : voice.muted ? "Muted" : "Listening")}
        </p>

        {voice.isConnected && (
          <div className="flex items-center gap-3">
            <Button
              onClick={voice.end}
              variant="destructive"
              size="lg"
              className="rounded-full px-8"
            >
              End Call
            </Button>
            <Button
              onClick={voice.toggleMute}
              variant="outline"
              size="lg"
              className="rounded-full px-6"
            >
              {voice.muted ? "Unmute" : "Mute"}
            </Button>
          </div>
        )}

        {/* Transcript */}
        {voice.messages.length > 0 && (
          <div
            ref={transcriptRef}
            className="w-full max-w-md max-h-64 overflow-y-auto rounded-lg bg-sobek-forest/50 border border-sobek-forest/30 p-4 space-y-2"
          >
            {voice.messages.map((msg, i) => (
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
