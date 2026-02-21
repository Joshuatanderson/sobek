"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { initiateDispute } from "@/app/product/actions";

export function DisputeButton({
  transactionId,
  buyerWallet,
}: {
  transactionId: string;
  buyerWallet: string;
}) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const isBuyer = address?.toLowerCase() === buyerWallet.toLowerCase();
  if (!isBuyer) return null;

  async function handleDispute() {
    if (!address) return;
    if (!confirm("Are you sure you want to dispute this transaction?")) return;

    setLoading(true);
    setResult(null);

    const res = await initiateDispute(transactionId, address);

    if (res.error) {
      setResult(res.error.message);
    } else {
      setResult("Disputed");
    }
    setLoading(false);
  }

  if (result === "Disputed") {
    return <span className="text-xs text-amber-400">Disputed</span>;
  }

  return (
    <div className="flex gap-1 items-center">
      <button
        onClick={handleDispute}
        disabled={loading}
        className="text-xs px-2 py-0.5 rounded border border-amber-700/50 bg-amber-900/40 text-amber-400 hover:bg-amber-900/60 disabled:opacity-50"
      >
        {loading ? "…" : "Dispute"}
      </button>
      {result && <span className="text-xs text-red-400">{result}</span>}
    </div>
  );
}
