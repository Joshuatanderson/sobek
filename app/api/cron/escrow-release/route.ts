import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { releaseEscrowOnBase } from "@/lib/base-escrow";
import { HEDERA_MIRROR_URL } from "@/lib/hedera";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret
  const secret = process.env.INTERNAL_API_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find active escrows with a Hedera schedule
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, hedera_schedule_id, escrow_registration, product_id")
    .eq("escrow_status", "active")
    .not("hedera_schedule_id", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{ orderId: string; status: string; error?: string }> = [];

  for (const order of orders ?? []) {
    try {
      // Poll Hedera mirror node for schedule execution
      const res = await fetch(
        `${HEDERA_MIRROR_URL}/api/v1/schedules/${order.hedera_schedule_id}`
      );

      if (!res.ok) {
        results.push({ orderId: order.id, status: "mirror_error" });
        continue;
      }

      const schedule = await res.json();

      if (!schedule.executed_timestamp) {
        results.push({ orderId: order.id, status: "pending" });
        continue;
      }

      if (order.escrow_registration == null) {
        results.push({ orderId: order.id, status: "missing_registration" });
        continue;
      }

      // Atomically claim this order for release — prevents concurrent cron double-release.
      // Only updates if escrow_status is still 'active' (optimistic lock).
      const { data: claimed, error: claimError } = await supabaseAdmin
        .from("orders")
        .update({ escrow_status: "releasing" })
        .eq("id", order.id)
        .eq("escrow_status", "active")
        .select("id")
        .single();

      if (claimError || !claimed) {
        // Another cron run already claimed it
        results.push({ orderId: order.id, status: "already_claimed" });
        continue;
      }

      // Look up receiver wallet: product → agent → user.wallet_address
      let receiverWallet: string | null = null;
      if (order.product_id) {
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("agent_id")
          .eq("id", order.product_id)
          .single();
        if (product?.agent_id) {
          const { data: user } = await supabaseAdmin
            .from("users")
            .select("wallet_address")
            .eq("id", product.agent_id)
            .single();
          receiverWallet = user?.wallet_address ?? null;
        }
      }

      // Release on-chain
      const txHash = await releaseEscrowOnBase(order.escrow_registration);

      // Record the release
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          escrow_status: "released",
          tx_hash: txHash,
          escrow_resolved_to: receiverWallet,
          escrow_resolved_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        // On-chain release succeeded but DB failed — log loudly, needs manual intervention
        console.error(
          `CRITICAL: On-chain release succeeded for order ${order.id} (tx: ${txHash}) but DB update failed:`,
          updateError
        );
        results.push({ orderId: order.id, status: "released_db_error", error: updateError.message });
        continue;
      }

      results.push({ orderId: order.id, status: "released" });
    } catch (err) {
      // If on-chain call failed, revert the claim so next run can retry
      await supabaseAdmin
        .from("orders")
        .update({ escrow_status: "active" })
        .eq("id", order.id)
        .eq("escrow_status", "releasing");

      results.push({
        orderId: order.id,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
