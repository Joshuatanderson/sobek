import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { createTransaction } from "@/app/product/actions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { product_id, tx_hash, wallet_address, escrow_registration, chain_id } =
    body as Record<string, unknown>;

  if (!product_id || typeof product_id !== "string") {
    return NextResponse.json({ error: "product_id is required" }, { status: 400 });
  }
  if (!tx_hash || typeof tx_hash !== "string") {
    return NextResponse.json({ error: "tx_hash is required" }, { status: 400 });
  }
  if (!wallet_address || typeof wallet_address !== "string") {
    return NextResponse.json({ error: "wallet_address is required" }, { status: 400 });
  }
  if (typeof escrow_registration !== "number" || !Number.isInteger(escrow_registration) || escrow_registration < 0) {
    return NextResponse.json(
      { error: "escrow_registration is required and must be a non-negative integer" },
      { status: 400 }
    );
  }

  // Validate wallet address format (basic 0x + 40 hex chars)
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet_address)) {
    return NextResponse.json({ error: "wallet_address must be a valid Ethereum address" }, { status: 400 });
  }

  // Validate tx_hash format (0x + 64 hex chars)
  if (!/^0x[0-9a-fA-F]{64}$/.test(tx_hash)) {
    return NextResponse.json({ error: "tx_hash must be a valid transaction hash" }, { status: 400 });
  }

  // Reject duplicate tx_hash — same on-chain deposit should only be recorded once
  const { data: existing } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("tx_hash", tx_hash)
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ error: "tx_hash already recorded" }, { status: 409 });
  }

  const result = await createTransaction(
    product_id,
    tx_hash,
    wallet_address,
    "USDC",
    escrow_registration,
    typeof chain_id === "number" ? chain_id : 8453
  );

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ transaction: result.data });
}
