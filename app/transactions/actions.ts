"use server";

import { supabaseAdmin } from "@/utils/supabase/admin";
import { releaseEscrow, refundEscrow } from "@/lib/base-escrow";
import {
  calculateDisputeLossSeller,
  calculateDisputeLossBuyer,
  getSellerMrate,
} from "@/lib/reputation";
import { logTierTransition } from "@/lib/hedera-hcs";
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

  // Atomically claim — only resolve if still "disputed"
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("transactions")
    .update({ escrow_status: resolution === "refund" ? "refunding" : "releasing" })
    .eq("id", transactionId)
    .eq("escrow_status", "disputed")
    .select("id")
    .single();

  if (claimError || !claimed) {
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

  try {
    const txHash =
      resolution === "refund"
        ? await refundEscrow(transaction.escrow_registration, transaction.chain_id)
        : await releaseEscrow(transaction.escrow_registration, transaction.chain_id);

    const resolvedTo = resolution === "refund" ? buyerWallet : sellerWallet;

    await supabaseAdmin
      .from("transactions")
      .update({
        escrow_status: resolution === "refund" ? "refunded" : "released",
        tx_hash: txHash,
        escrow_resolved_to: resolvedTo,
        escrow_resolved_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    // Reputation
    if (product?.price_usdc) {
      if (resolution === "refund" && sellerWallet) {
        await supabaseAdmin.from("reputation_events").insert({
          wallet: sellerWallet,
          delta: calculateDisputeLossSeller(product.price_usdc),
          reason: "dispute_refund",
          transaction_id: transactionId,
          amount_usd: product.price_usdc,
        });
      } else if (resolution === "release" && buyerWallet) {
        await supabaseAdmin.from("reputation_events").insert({
          wallet: buyerWallet,
          delta: calculateDisputeLossBuyer(product.price_usdc),
          reason: "dispute_release",
          transaction_id: transactionId,
          amount_usd: product.price_usdc,
        });
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
  } catch (err) {
    // Revert claim on failure
    await supabaseAdmin
      .from("transactions")
      .update({ escrow_status: "disputed" })
      .eq("id", transactionId)
      .eq("escrow_status", resolution === "refund" ? "refunding" : "releasing");

    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
