import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { registerAgent } from "@/lib/erc8004-register";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, title, description, price_usdc, status, users:agent_id(display_name, wallet_address, reputation_score)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, price_usdc, wallet_address, escrow_duration_seconds } =
    body as Record<string, unknown>;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!description || typeof description !== "string") {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }
  if (typeof price_usdc !== "number" || isNaN(price_usdc) || price_usdc <= 0) {
    return NextResponse.json({ error: "price_usdc must be a positive number" }, { status: 400 });
  }
  if (!wallet_address || typeof wallet_address !== "string") {
    return NextResponse.json({ error: "wallet_address is required" }, { status: 400 });
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet_address)) {
    return NextResponse.json({ error: "wallet_address must be a valid Ethereum address" }, { status: 400 });
  }

  // Validate optional escrow duration
  if (escrow_duration_seconds != null) {
    if (typeof escrow_duration_seconds !== "number" || !Number.isInteger(escrow_duration_seconds) || escrow_duration_seconds < 1) {
      return NextResponse.json({ error: "escrow_duration_seconds must be an integer >= 1" }, { status: 400 });
    }
  }

  // Resolve wallet to user (upsert so new sellers get a record)
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .upsert({ wallet_address }, { onConflict: "wallet_address" })
    .select("id, erc8004_agent_id")
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "Failed to resolve wallet" }, { status: 500 });
  }

  // Auto-register ERC-8004 agent if seller doesn't have one yet (best-effort)
  if (user.erc8004_agent_id == null) {
    try {
      const agentId = await registerAgent(wallet_address);
      await supabaseAdmin
        .from("users")
        .update({ erc8004_agent_id: agentId })
        .eq("id", user.id);
    } catch (err) {
      console.error("Non-fatal: ERC-8004 agent registration failed:", err);
    }
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .insert({
      title,
      description,
      price_usdc,
      escrow_duration_seconds: typeof escrow_duration_seconds === "number" ? escrow_duration_seconds : null,
      agent_id: user.id,
    })
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 400 });
  }

  return NextResponse.json({ product });
}
