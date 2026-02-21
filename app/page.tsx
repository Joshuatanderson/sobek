"use client";

export const dynamic = "force-dynamic";

import { useRef, useEffect } from "react";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SobekMascot } from "@/components/SobekMascot";
import { Header } from "@/components/header";
import { useSobekVoice } from "@/hooks/useSobekVoice";

const USE_CASES = [
  {
    title: "Sobek Swaps",
    description:
      "Swap any token instantly via Uniswap. Voice-powered trades with the best onchain rates.",
    image: "/sobek-swaps.png",
  },
  {
    title: "Sobek Reputation",
    description:
      "Onchain reputation for humans and agents. Identify trustworthy vendors before you transact.",
    image: "/sobek-buys.png",
  },
  {
    title: "Sobek Escrow",
    description:
      "Place funds in escrow and schedule payments on the blockchain. Trustless, automated, onchain.",
    image: "/sobek-escrow.png",
  },
] as const;

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

      {/* Hero */}
      <div className="mt-6 mb-4 max-w-2xl text-center space-y-2 px-4">
        <div className="flex justify-center mb-4">
          <SobekMascot />
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-sobek-gold">
          Sobek
        </h1>
        <p className="text-xl text-sobek-green-light/80">
          Your voice-powered onchain agent.
        </p>

        {/* Built on — commented out to reduce crowding
        <div className="flex items-center justify-center gap-6 pt-1">
          <span className="text-xs uppercase tracking-widest text-sobek-green-light/50">
            Built on
          </span>
          <div className="flex items-center gap-5">
            <Image src="/base-logo.svg" alt="Base" width={28} height={28} className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity" />
            <Image src="/hedera-logo.svg" alt="Hedera" width={28} height={28} className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity" />
            <Image src="/adi-logo.svg" alt="ADI" width={82} height={28} className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity" />
          </div>
        </div>
        */}
      </div>

      {/* Orb */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <button
          onClick={voice.isConnected ? voice.end : voice.start}
          disabled={voice.isConnecting}
          className={`orb relative z-10 ${voice.isSpeaking ? "orb-speaking" : ""} ${voice.isConnected ? "orb-connected" : ""} ${voice.isConnecting ? "opacity-60" : ""}`}
        />

        <p className="text-lg text-sobek-green-light/80">
          {voice.status === "disconnected" && (
            <span className="animate-pulse-subtle">Click the orb to talk to Sobek.</span>
          )}
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
      </div>

      {/* Use Case Cards — horizontal row */}
      <div className="w-full max-w-5xl px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {USE_CASES.map((uc) => (
            <div
              key={uc.title}
              className="group relative flex flex-row md:flex-col items-center md:items-center gap-4 md:gap-0 rounded-2xl border border-sobek-forest/40 bg-sobek-forest/10 p-4 transition-all hover:border-sobek-gold/40 hover:bg-sobek-forest/20"
            >
              <div className="shrink-0 h-20 w-20 md:h-36 md:w-36 md:mb-4 relative">
                <Image
                  src={uc.image}
                  alt={uc.title}
                  fill
                  className="object-contain drop-shadow-lg group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="md:text-center">
                <h3 className="text-lg md:text-xl font-bold text-sobek-gold mb-1 md:mb-2">
                  {uc.title}
                </h3>
                <p className="text-sm text-sobek-green-light/90 leading-relaxed">
                  {uc.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transcript — only when voice is active */}
      {voice.messages.length > 0 && (
        <div className="w-full max-w-md px-4 mt-6 pb-24">
          <div
            ref={transcriptRef}
            className="w-full max-h-64 overflow-y-auto rounded-lg bg-sobek-forest/50 border border-sobek-forest/30 p-4 space-y-2"
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
        </div>
      )}
    </div>
  );
}
