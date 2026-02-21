"use client";

import { useActionState, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { wagmiConfig } from "@/config/wagmi";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { buildAgentURI, IDENTITY_ABI } from "@/lib/erc8004";
import { ERC8004_IDENTITY_REGISTRY } from "@/config/constants";
import { createProduct, storeAgentId } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function CreateProductForm() {
  const { isConnected, address } = useWalletAuth();
  const { hasAgent, loading: agentLoading, setRegistered } = useAgentStatus();
  const [state, formAction, isPending] = useActionState(createProduct, null);
  const [regStatus, setRegStatus] = useState<"idle" | "registering" | "error">("idle");
  const [regError, setRegError] = useState("");

  async function handleRegister() {
    if (!address) return;
    setRegStatus("registering");
    setRegError("");

    try {
      const agentURI = buildAgentURI(address);

      const hash = await writeContract(wagmiConfig, {
        address: ERC8004_IDENTITY_REGISTRY,
        abi: IDENTITY_ABI,
        functionName: "register",
        args: [agentURI],
      });

      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
      if (receipt.status === "reverted") {
        throw new Error("Transaction reverted");
      }

      // Parse Transfer event for tokenId
      let tokenId: bigint | null = null;
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== ERC8004_IDENTITY_REGISTRY.toLowerCase()) continue;
        if (log.topics.length >= 4 && log.topics[3]) {
          tokenId = BigInt(log.topics[3]);
          break;
        }
      }

      if (tokenId === null) {
        throw new Error("No Transfer event found in register() tx");
      }

      // Store agent ID in DB
      const result = await storeAgentId(Number(tokenId));
      if (result.error) {
        throw new Error(result.error.message);
      }

      setRegistered(Number(tokenId));
      setRegStatus("idle");
    } catch (err: unknown) {
      setRegStatus("error");
      setRegError(err instanceof Error ? err.message.split("\n")[0] : "Registration failed");
    }
  }

  if (!isConnected) {
    return (
      <div className="rounded-lg border border-sobek-forest/30 bg-sobek-forest/50 p-6 space-y-4">
        <p className="text-sobek-green-light/80">Connect your wallet to create a product.</p>
        <ConnectButton />
      </div>
    );
  }

  if (agentLoading) {
    return (
      <div className="rounded-lg border border-sobek-forest/30 bg-sobek-forest/50 p-6">
        <p className="text-sobek-green-light/80">Loading...</p>
      </div>
    );
  }

  if (!hasAgent) {
    return (
      <div className="rounded-lg border border-sobek-forest/30 bg-sobek-forest/50 p-6 space-y-4">
        <p className="text-sobek-green-light/80">
          Register as a seller to list products. This mints a soulbound identity token to your wallet.
        </p>
        <Button
          onClick={handleRegister}
          disabled={regStatus === "registering"}
          size="lg"
          className="w-full"
        >
          {regStatus === "registering" ? "Registering..." : "Register as Seller"}
        </Button>
        {regStatus === "error" && (
          <p className="text-red-400 text-sm">{regError}</p>
        )}
      </div>
    );
  }

  return (
    <>
      <form action={formAction} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Smart contract audit"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe what the service includes..."
            rows={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_usdc">Price (USDC)</Label>
          <Input
            id="price_usdc"
            name="price_usdc"
            type="number"
            step="0.01"
            min="0"
            placeholder="100.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="escrow_duration_seconds">Escrow Duration (seconds)</Label>
          <Input
            id="escrow_duration_seconds"
            name="escrow_duration_seconds"
            type="number"
            step="1"
            min="1"
            placeholder="10"
          />
          <p className="text-xs text-sobek-green-light/50">
            How long funds are held in escrow before auto-releasing to you. Defaults to 10s if left blank.
          </p>
        </div>

        <Button type="submit" disabled={isPending} size="lg" className="w-full">
          {isPending ? "Creating..." : "Create Product"}
        </Button>
      </form>

      {state && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-sobek-green-light/80">Debug Response</h2>
          <pre className="rounded-lg bg-sobek-forest/50 border border-sobek-forest/30 p-4 text-sm text-sobek-green-light/70 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(state, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
}
