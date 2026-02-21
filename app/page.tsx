"use client";

export const dynamic = "force-dynamic";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SobekMascot } from "@/components/SobekMascot";
import { Header } from "@/components/header";
import { useSobekVoice } from "@/hooks/useSobekVoice";
import { OrbScales } from "@/components/orb-scales";

const USE_CASES = [
  {
    title: "Swap Tokens by Voice",
    description:
      "Painless UX for newcomers to crypto. The agent handles execution via Uniswap. No interface to figure out.",
    image: "/sobek-swaps.png",
  },
  {
    title: "Institution-Ready Reputation",
    description:
      "On-chain reputation that uses volume, success rates, and transaction scale, built on top of ERC-8004. Sybil-resistant, with humans and agents as first-class citizens.",
    image: "/sobek-bias-2.png",
  },
  {
    title: "Institutional-Grade Escrow with On-Chain Timing",
    description:
      "Clean, on-chain escrow for both simple transactions. Fast finality for simple contracts. Security for complex and high-stakes projects.",
    image: "/sobek-escrow.png",
  },
] as const;

export default function Home() {
  const transcriptRef = useRef<HTMLDivElement>(null);
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
          Voice makes crypto invisible. Reputation makes it trustworthy.
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
      <div className="relative flex flex-col items-center gap-4 mb-8">
        <button
          onClick={voice.isConnected ? voice.end : voice.start}
          disabled={voice.isConnecting}
          className={`orb relative z-10 ${voice.isSpeaking ? "orb-speaking" : ""} ${voice.isConnected ? "orb-connected" : ""} ${voice.isConnecting ? "opacity-60" : ""}`}
        >
          <OrbScales />
        </button>

        {/* Chalk arrow annotation */}
        {voice.status === "disconnected" && (
          <div className="absolute -right-40 sm:-right-48 -top-2 animate-pulse-subtle pointer-events-none select-none">
            <svg
              width="160"
              height="120"
              viewBox="0 0 160 120"
              fill="none"
              className="overflow-visible"
            >
              {/* Chalk texture filter */}
              <defs>
                <filter id="chalk" x="-5%" y="-5%" width="110%" height="110%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.65"
                    numOctaves="3"
                    result="noise"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale="2.5"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              </defs>

              {/* "click to start" text — tilted, chalk-style */}
              <text
                x="100"
                y="22"
                textAnchor="middle"
                fontFamily="inherit"
                fontSize="18"
                fontStyle="italic"
                fill="rgba(205, 223, 197, 0.85)"
                transform="rotate(-8, 100, 22)"
                filter="url(#chalk)"
              >
                click to start
              </text>

              {/*
                Curved arrow — 90° gradual turn: down then left
                Cubic bezier: P0=(80,35) P1=(80,65) P2=(40,98) P3=(18,98)
                Tangent at start: P1-P0 = (0, 30)   → vertical (down)
                Tangent at end:   P3-P2 = (-22, 0)  → horizontal (left)
              */}
              <g filter="url(#chalk)">
                {/* Base stroke */}
                <path
                  d="M80 35 C80 65, 40 98, 18 98"
                  stroke="rgba(205, 223, 197, 0.5)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Offset stroke 1 — +1px for chalk grain */}
                <path
                  d="M81 36 C81 66, 41 99, 19 99"
                  stroke="rgba(205, 223, 197, 0.35)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Offset stroke 2 — -1px other direction */}
                <path
                  d="M79 34 C79 64, 39 97, 17 97"
                  stroke="rgba(205, 223, 197, 0.3)"
                  strokeWidth="1"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              {/*
                Arrowhead at tip (18, 98). Arrow ends going left.
                Each arm 45° from horizontal, 14px long (10px on each axis).
                Arm 1: up-right   → (18+10, 98-10) = (28, 88)
                Arm 2: down-right → (18+10, 98+10) = (28, 108)
              */}
              <g filter="url(#chalk)">
                <path
                  d="M18 98 L28 88"
                  stroke="rgba(205, 223, 197, 0.8)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M18 98 L28 108"
                  stroke="rgba(205, 223, 197, 0.8)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            </svg>
          </div>
        )}

        <p className="text-lg text-sobek-green-light/80">
          {voice.isConnecting && "Connecting..."}
          {voice.isConnected &&
            (voice.isSpeaking
              ? "Agent speaking"
              : voice.muted
                ? "Muted"
                : "Listening")}
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
