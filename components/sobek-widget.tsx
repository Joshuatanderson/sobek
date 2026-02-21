"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSobekVoice } from "@/hooks/useSobekVoice";
import { OrbScales } from "@/components/orb-scales";

export function SobekWidget() {
  const [open, setOpen] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const voice = useSobekVoice({ onNavigate: (path) => router.push(path) });

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [voice.messages]);

  return (
    <>
      {/* Cursor override for widget elements (global cursor:none !important) */}
      <style>{`
        .sobek-widget-root, .sobek-widget-root * { cursor: auto !important; }
        .sobek-widget-root button, .sobek-widget-root a,
        .sobek-widget-root [role="button"] { cursor: pointer !important; }
      `}</style>

      {/* Launcher pill */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close Sobek assistant" : "Open Sobek assistant"}
        className="sobek-widget-root fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#0a0f0a] px-4 py-3 shadow-lg border border-sobek-forest/40 hover:border-sobek-gold/40 transition-colors"
      >
        <Image src="/sobek.png" alt="Sobek" width={28} height={28} className="rounded-full" />
        <span className="text-sm font-medium text-sobek-green-light">Ask Sobek</span>
        {/* Active call indicator */}
        {voice.isConnected && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
        )}
      </button>

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Sobek voice assistant"
        aria-hidden={!open}
        className={`sobek-widget-root fixed bottom-20 right-6 z-50 w-80 rounded-xl border border-sobek-forest/40 bg-[#0a0f0a] shadow-2xl transition-all duration-200 ${
          open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sobek-forest/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/sobek.png" alt="Sobek" width={24} height={24} className="rounded-full" />
            <span className="text-sm font-semibold text-sobek-gold">Sobek</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="text-sobek-green-light/50 hover:text-sobek-green-light transition-colors text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Wallet */}
        <div className="border-b border-sobek-forest/30 px-4 py-3">
          <ConnectButton showBalance={false} />
        </div>

        {/* Orb + status */}
        <div className="flex flex-col items-center gap-3 py-5">
          <button
            onClick={voice.isConnected ? voice.end : voice.start}
            disabled={voice.isConnecting}
            aria-label={voice.isConnected ? "End voice session" : "Start voice session"}
            className={`orb relative z-10 ${voice.isSpeaking ? "orb-speaking" : ""} ${voice.isConnected ? "orb-connected" : ""} ${voice.isConnecting ? "opacity-60" : ""}`}
            style={{ width: 80, height: 80 }}
          >
            <OrbScales size={80} />
          </button>
          <p className="text-xs text-sobek-green-light/70">
            {voice.status === "disconnected" && "Click to start"}
            {voice.isConnecting && "Connecting..."}
            {voice.isConnected &&
              (voice.isSpeaking ? "Speaking" : voice.muted ? "Muted" : "Listening")}
          </p>
        </div>

        {/* Controls */}
        {voice.isConnected && (
          <div className="flex items-center justify-center gap-2 px-4 pb-3">
            <button
              onClick={voice.end}
              className="flex-1 rounded-full bg-red-600 hover:bg-red-700 py-2 text-sm font-semibold text-white transition-colors"
            >
              End Call
            </button>
            <button
              onClick={voice.toggleMute}
              className="rounded-full border border-sobek-forest/40 px-4 py-2 text-sm font-medium text-sobek-green-light/80 hover:border-sobek-green-light/40 transition-colors"
            >
              {voice.muted ? "Unmute" : "Mute"}
            </button>
          </div>
        )}

        {/* Transcript */}
        {voice.messages.length > 0 && (
          <div
            ref={transcriptRef}
            className="max-h-40 overflow-y-auto border-t border-sobek-forest/30 px-4 py-3 space-y-1.5"
          >
            {voice.messages.map((msg, i) => (
              <div key={i} className="text-xs">
                <span className={msg.role === "agent" ? "text-sobek-gold" : "text-sobek-green/50"}>
                  {msg.role === "agent" ? "Sobek" : "You"}:
                </span>{" "}
                <span className="text-sobek-green/80">{msg.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
