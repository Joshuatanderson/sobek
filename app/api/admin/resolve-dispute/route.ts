import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { releaseEscrow, refundEscrow } from "@/lib/base-escrow";
import {
  calculateDisputeLossSeller,
  calculateDisputeLossBuyer,
  getSellerMrate,
} from "@/lib/reputation";
import { logTierTransition } from "@/lib/hedera-hcs";
import { notifyUser } from "@/utils/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Auth — same pattern as cron
  const secret = process.env.INTERNAL_API_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.transactionId || !["refund", "release"].includes(body.resolution)) {
    return NextResponse.json(
      { error: "Body must include transactionId (string) and resolution ('refund' | 'release')" },
      { status: 400 }
    );
  }

  const { transactionId, resolution } = body as {
    transactionId: string;
    resolution: "refund" | "release";
  };

  // Fetch transaction + related product/user data
  const { data: transaction, error: txError } = await supabaseAdmin
    .from("transactions")
    .select("id, escrow_status, escrow_registration, product_id, client_id, chain_id")
    .eq("id", transactionId)
    .single();

  if (txError || !transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
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
    return NextResponse.json(
      { error: "Transaction is not in disputed state (may already be resolved)" },
      { status: 409 }
    );
  }

  if (transaction.escrow_registration == null) {
    return NextResponse.json({ error: "Transaction has no escrow registration" }, { status: 400 });
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

  // Snapshot Mrate before resolution for tier transition check
  let beforeMrate: Awaited<ReturnType<typeof getSellerMrate>> | null = null;
  if (sellerWallet) {
    beforeMrate = await getSellerMrate(supabaseAdmin, sellerWallet);
  }

  try {
    // Execute on-chain
    const txHash =
      resolution === "refund"
        ? await refundEscrow(transaction.escrow_registration, transaction.chain_id)
        : await releaseEscrow(transaction.escrow_registration, transaction.chain_id);

    const resolvedTo = resolution === "refund" ? buyerWallet : sellerWallet;

    // Update DB
    const { error: updateError } = await supabaseAdmin
      .from("transactions")
      .update({
        escrow_status: resolution === "refund" ? "refunded" : "released",
        tx_hash: txHash,
        escrow_resolved_to: resolvedTo,
        escrow_resolved_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      console.error(
        `CRITICAL: On-chain ${resolution} succeeded for transaction ${transactionId} (tx: ${txHash}) but DB update failed:`,
        updateError
      );
      return NextResponse.json(
        { error: "On-chain succeeded but DB update failed — needs manual intervention", txHash },
        { status: 500 }
      );
    }

    // Reputation event
    if (product?.price_usdc) {
      if (resolution === "refund" && sellerWallet) {
        // Buyer won dispute → seller loses rep
        const delta = calculateDisputeLossSeller(product.price_usdc);
        await supabaseAdmin.from("reputation_events").insert({
          wallet: sellerWallet,
          delta,
          reason: "dispute_refund",
          transaction_id: transactionId,
          amount_usd: product.price_usdc,
        });
      } else if (resolution === "release" && buyerWallet) {
        // Seller won dispute → buyer loses rep
        const delta = calculateDisputeLossBuyer(product.price_usdc);
        await supabaseAdmin.from("reputation_events").insert({
          wallet: buyerWallet,
          delta,
          reason: "dispute_release",
          transaction_id: transactionId,
          amount_usd: product.price_usdc,
        });
      }
    }

    // HCS tier transition logging (seller only — they have the Mrate)
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

    // Notify both parties
    const resolutionLabel = resolution === "refund" ? "refunded to buyer" : "released to seller";
    const message = `Dispute resolved: transaction ${transactionId.slice(0, 8)}… has been ${resolutionLabel}.`;

    if (sellerId) notifyUser(sellerId, message).catch(() => {});
    if (buyerId) notifyUser(buyerId, message).catch(() => {});

    return NextResponse.json({ status: resolution === "refund" ? "refunded" : "released", txHash });
  } catch (err) {
    // On-chain failed — revert the claim
    await supabaseAdmin
      .from("transactions")
      .update({ escrow_status: "disputed" })
      .eq("id", transactionId)
      .eq("escrow_status", resolution === "refund" ? "refunding" : "releasing");

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
