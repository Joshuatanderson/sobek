"use client";

import { useActionState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { createProduct } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function CreateProductForm() {
  const { isConnected } = useWalletAuth();
  const [state, formAction, isPending] = useActionState(createProduct, null);

  return (
    <>
      {!isConnected ? (
        <div className="rounded-lg border border-sobek-forest/30 bg-sobek-forest/50 p-6 space-y-4">
          <p className="text-sobek-green-light/80">Connect your wallet to create a product.</p>
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
            {isPending ? "Creating..." : "Create Product"}
          </Button>
        </form>
      )}

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
