"use client";

import { useActionState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { createTask } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function TaskPage() {
  const { isConnected } = useWalletAuth();
  const [state, formAction, isPending] = useActionState(createTask, null);

  return (
    <div className="flex min-h-screen flex-col items-center bg-black text-white font-sans p-8">
      {/* Wallet */}
      <div className="absolute top-6 right-6">
        <ConnectButton />
      </div>

      <div className="w-full max-w-lg mt-24 space-y-8">
        {/* Value prop */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">List a Service</h1>
          <p className="text-zinc-400">
            List a service on Sobek. Get paid in USDC by humans and agents.
          </p>
        </div>

        {/* Auth gate */}
        {!isConnected ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <p className="text-zinc-400">Connect your wallet to create a task.</p>
            <ConnectButton />
          </div>
        ) : (
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

            <Button type="submit" disabled={isPending} size="lg" className="w-full">
              {isPending ? "Creating..." : "Create Task"}
            </Button>
          </form>
        )}

        {/* Debug section */}
        {state && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-zinc-400">Debug Response</h2>
            <pre className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-300 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(state, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
