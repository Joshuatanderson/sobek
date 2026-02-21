"use client";

import { useState } from "react";
import { resolveDispute } from "./actions";

export function DisputeActions({ transactionId }: { transactionId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleResolve(resolution: "refund" | "release") {
    if (!confirm(`Are you sure you want to ${resolution} this dispute?`)) return;

    setLoading(true);
    setResult(null);

    const res = await resolveDispute(transactionId, resolution);

    if (res.error) {
      setResult(`Error: ${res.error}`);
    } else {
      setResult(resolution === "refund" ? "Refunded" : "Released");
    }
    setLoading(false);
  }

  if (result && !result.startsWith("Error")) {
    return (
      <span className="text-xs text-green-400">{result}</span>
    );
  }

  return (
    <div className="flex gap-1 items-center">
      <button
        onClick={() => handleResolve("refund")}
        disabled={loading}
        className="text-xs px-2 py-0.5 rounded border border-red-700/50 bg-red-900/40 text-red-400 hover:bg-red-900/60 disabled:opacity-50"
      >
        {loading ? "…" : "Refund"}
      </button>
      <button
        onClick={() => handleResolve("release")}
        disabled={loading}
        className="text-xs px-2 py-0.5 rounded border border-green-700/50 bg-green-900/40 text-green-400 hover:bg-green-900/60 disabled:opacity-50"
      >
        {loading ? "…" : "Release"}
      </button>
      {result && <span className="text-xs text-red-400">{result}</span>}
    </div>
  );
}
