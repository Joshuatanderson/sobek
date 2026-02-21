import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("transactions")
    .select(
      "id, product_id, tx_hash, status, escrow_status, escrow_registration, chain_id, created_at, paid_at, release_at, escrow_resolved_at, escrow_resolved_to, dispute_initiated_at, dispute_initiated_by, products:product_id(title, price_usdc)"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
