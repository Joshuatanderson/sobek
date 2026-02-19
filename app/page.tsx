"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "agent";
  text: string;
}

const AGENT_ID = "agent_7901khta30m9ehv9b3d5jvdx1qmh";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
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
      await conversation.startSession({ agentId: AGENT_ID });
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white font-sans gap-8 p-8">
      {/* Orb */}
      <div
        className={`orb ${conversation.isSpeaking ? "orb-speaking" : ""} ${isConnected ? "orb-connected" : ""}`}
      />

      {/* Status */}
      <p className="text-sm text-zinc-400">
        {conversation.status === "disconnected" && "Ready"}
        {isConnecting && "Connecting..."}
        {isConnected && (conversation.isSpeaking ? "Agent speaking" : "Listening")}
      </p>

      {/* Button */}
      <button
        onClick={isConnected ? handleEnd : handleStart}
        disabled={isConnecting}
        className={`rounded-full px-8 py-3 text-sm font-medium transition-all ${
          isConnected
            ? "bg-red-600 hover:bg-red-700"
            : "bg-cyan-600 hover:bg-cyan-700"
        } disabled:opacity-50`}
      >
        {isConnecting ? "Connecting..." : isConnected ? "End Call" : "Start Call"}
      </button>

      {/* Transcript */}
      {messages.length > 0 && (
        <div
          ref={transcriptRef}
          className="w-full max-w-md max-h-64 overflow-y-auto rounded-lg bg-zinc-900 p-4 space-y-2"
        >
          {messages.map((msg, i) => (
            <div key={i} className="text-sm">
              <span className={msg.role === "agent" ? "text-cyan-400" : "text-zinc-400"}>
                {msg.role === "agent" ? "Agent" : "You"}:
              </span>{" "}
              <span className="text-zinc-200">{msg.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
