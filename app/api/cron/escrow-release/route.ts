import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { releaseEscrow } from "@/lib/base-escrow";
import { HEDERA_MIRROR_URL } from "@/lib/hedera";
import {
  calculateSuccessSeller,
  getSellerMrate,
} from "@/lib/reputation";
import { logTierTransition, logReputationEvent } from "@/lib/hedera-hcs";
import { giveFeedback } from "@/lib/erc8004";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret
  const secret = process.env.INTERNAL_API_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find active escrows with a Hedera schedule
  const { data: transactions, error } = await supabaseAdmin
    .from("transactions")
    .select("id, hedera_schedule_id, escrow_registration, product_id, chain_id")
    .eq("escrow_status", "active")
    .not("hedera_schedule_id", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{ transactionId: string; status: string; error?: string }> = [];

  for (const transaction of transactions ?? []) {
    try {
      // Poll Hedera mirror node for schedule execution
      const res = await fetch(
        `${HEDERA_MIRROR_URL}/api/v1/schedules/${transaction.hedera_schedule_id}`
      );

      if (!res.ok) {
        results.push({ transactionId: transaction.id, status: "mirror_error" });
        continue;
      }

      const schedule = await res.json();

      if (!schedule.executed_timestamp) {
        results.push({ transactionId: transaction.id, status: "pending" });
        continue;
      }

      if (transaction.escrow_registration == null) {
        results.push({ transactionId: transaction.id, status: "missing_registration" });
        continue;
      }

      // Atomically claim this transaction for release — prevents concurrent cron double-release.
      // Only updates if escrow_status is still 'active' (optimistic lock).
      const { data: claimed, error: claimError } = await supabaseAdmin
        .from("transactions")
        .update({ escrow_status: "releasing" })
        .eq("id", transaction.id)
        .eq("escrow_status", "active")
        .select("id")
        .single();

      if (claimError || !claimed) {
        // Another cron run already claimed it
        results.push({ transactionId: transaction.id, status: "already_claimed" });
        continue;
      }

      // Look up receiver wallet: product → agent → user.wallet_address
      let receiverWallet: string | null = null;
      let product: { agent_id: string | null; price_usdc: number } | null = null;
      let sellerUser: { id: string; wallet_address: string; erc8004_agent_id: number | null } | null = null;
      if (transaction.product_id) {
        const { data: productData } = await supabaseAdmin
          .from("products")
          .select("agent_id, price_usdc")
          .eq("id", transaction.product_id)
          .single();
        product = productData;
        if (product?.agent_id) {
          const { data: userData } = await supabaseAdmin
            .from("users")
            .select("id, wallet_address, erc8004_agent_id")
            .eq("id", product.agent_id)
            .single();
          sellerUser = userData;
          receiverWallet = sellerUser?.wallet_address ?? null;
        }
      }

      // Snapshot Mrate BEFORE marking released — the transaction is still 'releasing'
      // so it doesn't count in the success rate yet.
      let beforeMrate: Awaited<ReturnType<typeof getSellerMrate>> | null = null;
      if (receiverWallet && product?.price_usdc) {
        beforeMrate = await getSellerMrate(supabaseAdmin, receiverWallet);
      }

      // Release on-chain
      const txHash = await releaseEscrow(transaction.escrow_registration, transaction.chain_id);

      // Record the release
      const { error: updateError } = await supabaseAdmin
        .from("transactions")
        .update({
          escrow_status: "released",
          tx_hash: txHash,
          escrow_resolved_to: receiverWallet,
          escrow_resolved_at: new Date().toISOString(),
        })
        .eq("id", transaction.id);

      if (updateError) {
        // On-chain release succeeded but DB failed — log loudly, needs manual intervention
        console.error(
          `CRITICAL: On-chain release succeeded for transaction ${transaction.id} (tx: ${txHash}) but DB update failed:`,
          updateError
        );
        results.push({ transactionId: transaction.id, status: "released_db_error", error: updateError.message });
        continue;
      }

      // --- Reputation event + HCS logging ---
      if (receiverWallet && product?.price_usdc) {
        const delta = calculateSuccessSeller(product.price_usdc);

        const { data: repEvent } = await supabaseAdmin.from("reputation_events").insert({
          wallet: receiverWallet,
          delta,
          reason: "transaction_released",
          transaction_id: transaction.id,
          amount_usd: product.price_usdc,
        }).select("id").single();

        // Log to Hedera HCS (best-effort)
        if (repEvent) {
          try {
            const seq = await logReputationEvent({
              wallet: receiverWallet,
              delta,
              reason: "transaction_released",
              amount_usd: product.price_usdc,
              transaction_id: transaction.id,
              timestamp: new Date().toISOString(),
            });
            await supabaseAdmin.from("reputation_events")
              .update({ hcs_sequence: seq })
              .eq("id", repEvent.id);
          } catch (hcsErr) {
            console.error("Non-fatal: HCS reputation log failed:", hcsErr);
          }
        }

        // Check Mrate AFTER — transaction is now 'released', so success rate may have changed
        const after = await getSellerMrate(supabaseAdmin, receiverWallet);

        if (beforeMrate && beforeMrate.tier !== after.tier) {
          const { data: updatedUser } = await supabaseAdmin
            .from("users")
            .select("reputation_sum")
            .eq("wallet_address", receiverWallet)
            .single();

          await logTierTransition({
            wallet: receiverWallet,
            previousTier: beforeMrate.tier,
            newTier: after.tier,
            reputationScore: updatedUser?.reputation_sum ?? 0,
            transactionId: transaction.id,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // --- ERC-8004 on-chain reputation (best-effort) ---
      if (sellerUser && product?.price_usdc) {
        if (sellerUser.erc8004_agent_id == null) {
          console.warn(
            `Seller ${sellerUser.id} has no erc8004_agent_id — skipping ERC-8004 feedback for transaction ${transaction.id}`
          );
        } else {
          try {
            const agentId = BigInt(sellerUser.erc8004_agent_id);
            const delta = calculateSuccessSeller(product.price_usdc);
            await giveFeedback(agentId, delta, "escrow-release");
          } catch (erc8004Err) {
            // ERC-8004 must never block escrow release
            console.error(
              `Non-fatal: ERC-8004 feedback failed for transaction ${transaction.id}:`,
              erc8004Err
            );
          }
        }
      }

      results.push({ transactionId: transaction.id, status: "released" });
    } catch (err) {
      // If on-chain call failed, revert the claim so next run can retry
      await supabaseAdmin
        .from("transactions")
        .update({ escrow_status: "active" })
        .eq("id", transaction.id)
        .eq("escrow_status", "releasing");

      results.push({
        transactionId: transaction.id,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
