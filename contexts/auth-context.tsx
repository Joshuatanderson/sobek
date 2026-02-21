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

  // Sign out on disconnect
  useEffect(() => {
    if (!isConnected) {
      prevAddress.current = undefined;
      supabase.auth.signOut();
    }
  }, [isConnected]);

  // Sign in on connect / switch
  useEffect(() => {
    if (!isConnected || !address || address === prevAddress.current) return;

    const wasConnected = prevAddress.current !== undefined;
    prevAddress.current = address;

    (async () => {
      if (wasConnected) {
        await supabase.auth.signOut();
      }

      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: "ethereum",
        statement: "Sign in to Sobek",
      });

      if (error) {
        console.error("Web3 sign-in failed:", error.message);
        return;
      }

      await supabase.from("users").upsert(
        {
          id: data.user.id,
          wallet_address: address,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
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
