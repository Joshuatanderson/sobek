import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const UNISWAP_API = "https://trade-api.gateway.uniswap.org/v1/quote";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.UNISWAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "UNISWAP_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json();

  const res = await fetch(UNISWAP_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      ...body,
      protocols: ["V2", "V3", "V4"],
    }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
