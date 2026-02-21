"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

export type UserProfile = {
  display_name: string | null;
  wallet_address: string;
  telegram_handle: string | null;
  telegram_chat_id: number | null;
  erc8004_agent_id: number | null;
  reputation_sum: number | null;
};

type AuthContextValue = {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const prevAddress = useRef<string | undefined>(undefined);

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select(
        "display_name, wallet_address, telegram_handle, telegram_chat_id, erc8004_agent_id, reputation_sum"
      )
      .eq("id", userId)
      .single();
    setUserProfile(data);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  // Sign in on connect / address switch — matches old useWalletAuth pattern
  useEffect(() => {
    console.log("[AUTH] effect fired:", { isConnected, address: address?.slice(0, 10), prev: prevAddress.current?.slice(0, 10) });
    if (!isConnected || !address || address === prevAddress.current) return;
    prevAddress.current = address;

    (async () => {
      try {
        // Skip sign-in if we already have a valid session
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("[AUTH] existing session?", !!sessionData.session, sessionData.session?.user?.id?.slice(0, 8));
        if (sessionData.session) {
          // Already signed in — just touch last_seen_at
          await supabase.from("users")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("id", sessionData.session.user.id);
          return;
        }

        console.log("[AUTH] no session, calling signInWithWeb3...");
        const { data, error } = await supabase.auth.signInWithWeb3({
          chain: "ethereum",
          statement: "Sign in to Sobek",
        });

        if (error) {
          console.error("[AUTH] signInWithWeb3 failed:", error.message);
          return;
        }
        console.log("[AUTH] signInWithWeb3 success, user:", data.user.id.slice(0, 8));

        const { error: upsertErr } = await supabase.from("users").upsert(
          {
            id: data.user.id,
            wallet_address: address,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "wallet_address" }
        );
        if (upsertErr) console.error("[AUTH] upsert failed:", upsertErr.code, upsertErr.message);
      } catch (err) {
        console.error("[AUTH] flow error:", err);
      }
    })();
  }, [address, isConnected]);

  // Listen to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        setUserProfile(null);
      }
    });

    // Hydrate from existing session
    supabase.auth.getUser().then(({ data: { user: existing } }) => {
      if (existing) {
        setUser(existing);
        fetchProfile(existing.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        address,
        isConnected,
        user,
        userProfile,
        isAuthenticated: isConnected && user !== null,
        loading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
