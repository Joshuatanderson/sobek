"use server";

import { supabaseAdmin } from "@/utils/supabase/admin";
import { releaseEscrow, refundEscrow } from "@/lib/base-escrow";
import {
  calculateDisputeLossSeller,
  calculateDisputeLossBuyer,
  getSellerMrate,
} from "@/lib/reputation";
import { logTierTransition, logReputationEvent } from "@/lib/hedera-hcs";
import { notifyUser } from "@/utils/telegram";
import { revalidatePath } from "next/cache";

export async function resolveDispute(
  transactionId: string,
  resolution: "refund" | "release"
) {
  // Fetch transaction
  const { data: transaction, error: txError } = await supabaseAdmin
    .from("transactions")
    .select("id, escrow_status, escrow_registration, product_id, client_id, chain_id")
    .eq("id", transactionId)
    .single();

  if (txError || !transaction) {
    return { error: "Transaction not found" };
  }

  if (transaction.escrow_status !== "disputed") {
    return { error: "Transaction is not in disputed state" };
  }

  if (transaction.escrow_registration == null) {
    return { error: "No escrow registration" };
  }

  // Look up product + seller + buyer
  let product: { agent_id: string | null; price_usdc: number } | null = null;
  let sellerWallet: string | null = null;
  let sellerId: string | null = null;
  if (transaction.product_id) {
    const { data: p } = await supabaseAdmin
      .from("products")
      .select("agent_id, price_usdc")
      .eq("id", transaction.product_id)
      .single();
    product = p;
    if (product?.agent_id) {
      const { data: seller } = await supabaseAdmin
        .from("users")
        .select("id, wallet_address")
        .eq("id", product.agent_id)
        .single();
      sellerId = seller?.id ?? null;
      sellerWallet = seller?.wallet_address ?? null;
    }
  }

  let buyerWallet: string | null = null;
  let buyerId: string | null = null;
  if (transaction.client_id) {
    const { data: buyer } = await supabaseAdmin
      .from("users")
      .select("id, wallet_address")
      .eq("id", transaction.client_id)
      .single();
    buyerId = buyer?.id ?? null;
    buyerWallet = buyer?.wallet_address ?? null;
  }

  let beforeMrate: Awaited<ReturnType<typeof getSellerMrate>> | null = null;
  if (sellerWallet) {
    beforeMrate = await getSellerMrate(supabaseAdmin, sellerWallet);
  }

  // Execute on-chain first — if this fails, DB stays unchanged
  let txHash: string;
  try {
    txHash =
      resolution === "refund"
        ? await refundEscrow(transaction.escrow_registration, transaction.chain_id)
        : await releaseEscrow(transaction.escrow_registration, transaction.chain_id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "On-chain call failed" };
  }

  const finalStatus = resolution === "refund" ? "refunded" : "released";
  const resolvedTo = resolution === "refund" ? buyerWallet : sellerWallet;

  // Atomically update — optimistic lock on "disputed" prevents double-resolve
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("transactions")
    .update({
      escrow_status: finalStatus,
      tx_hash: txHash,
      escrow_resolved_to: resolvedTo,
      escrow_resolved_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .eq("escrow_status", "disputed")
    .select("id")
    .single();

  if (updateError || !updated) {
    return { error: "On-chain succeeded but DB update failed — check manually" };
  }

  // Reputation
  if (product?.price_usdc) {
    let repWallet: string | null = null;
    let repDelta = 0;
    let repReason = "";

    if (resolution === "refund" && sellerWallet) {
      repWallet = sellerWallet;
      repDelta = calculateDisputeLossSeller(product.price_usdc);
      repReason = "dispute_refund";
    } else if (resolution === "release" && buyerWallet) {
      repWallet = buyerWallet;
      repDelta = calculateDisputeLossBuyer(product.price_usdc);
      repReason = "dispute_release";
    }

    if (repWallet) {
      const { data: repEvent } = await supabaseAdmin.from("reputation_events").insert({
        wallet: repWallet,
        delta: repDelta,
        reason: repReason,
        transaction_id: transactionId,
        amount_usd: product.price_usdc,
      }).select("id").single();

      // Log to Hedera HCS (best-effort)
      if (repEvent) {
        try {
          const seq = await logReputationEvent({
            wallet: repWallet,
            delta: repDelta,
            reason: repReason,
            amount_usd: product.price_usdc,
            transaction_id: transactionId,
            timestamp: new Date().toISOString(),
          });
          await supabaseAdmin.from("reputation_events")
            .update({ hcs_sequence: seq })
            .eq("id", repEvent.id);
        } catch (hcsErr) {
          console.error("Non-fatal: HCS reputation log failed:", hcsErr);
        }
      }
    }
  }

  // HCS tier transition
  if (sellerWallet && beforeMrate) {
    const after = await getSellerMrate(supabaseAdmin, sellerWallet);
    if (beforeMrate.tier !== after.tier) {
      const { data: updatedUser } = await supabaseAdmin
        .from("users")
        .select("reputation_sum")
        .eq("wallet_address", sellerWallet)
        .single();

      await logTierTransition({
        wallet: sellerWallet,
        previousTier: beforeMrate.tier,
        newTier: after.tier,
        reputationScore: updatedUser?.reputation_sum ?? 0,
        transactionId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Notify
  const label = resolution === "refund" ? "refunded to buyer" : "released to seller";
  const message = `Dispute resolved: transaction ${transactionId.slice(0, 8)}… has been ${label}.`;
  if (sellerId) notifyUser(sellerId, message).catch(() => {});
  if (buyerId) notifyUser(buyerId, message).catch(() => {});

  revalidatePath("/transactions");
  return { error: null, txHash };
}
