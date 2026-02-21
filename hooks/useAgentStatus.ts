"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export function useAgentStatus() {
  const [agentId, setAgentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("erc8004_agent_id")
        .eq("id", sessionData.session.user.id)
        .single();

      setAgentId(data?.erc8004_agent_id ?? null);
      setLoading(false);
    })();
  }, []);

  const setRegistered = (id: number) => setAgentId(id);

  return {
    agentId,
    hasAgent: agentId != null,
    loading,
    setRegistered,
  };
}
