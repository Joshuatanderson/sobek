"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const prevAddress = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isConnected || !address || address === prevAddress.current) return;
    prevAddress.current = address;

    (async () => {
      // Skip sign-in if we already have a valid session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        // Still upsert last_seen_at
        await supabase.from("users").upsert(
          {
            id: sessionData.session.user.id,
            wallet_address: address,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
        return;
      }

      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: "ethereum",
        statement: "Sign in to Sobek",
      });

      if (error) {
        console.error("Web3 sign-in failed:", error.message);
        return;
      }

      // Upsert into public.users so wallet_address is stored
      const userId = data.user.id;
      await supabase.from("users").upsert(
        {
          id: userId,
          wallet_address: address,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    })();
  }, [address, isConnected]);

  return { address, isConnected };
}
