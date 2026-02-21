"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { notifyUser } from "@/utils/telegram";
import { revalidatePath } from "next/cache";
import { createEscrowSchedule } from "@/lib/hedera-schedule";
import { cancelEscrowSchedule } from "@/lib/hedera-dispute";

export async function createProduct(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: { message: "Not authenticated" } };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priceRaw = formData.get("price_usdc") as string;
  const price_usdc = parseFloat(priceRaw);

  if (!title || !description || isNaN(price_usdc)) {
    return { data: null, error: { message: "Missing required fields" } };
  }

  if (price_usdc <= 0) {
    return { data: null, error: { message: "Price must be greater than zero" } };
  }

  const result = await supabase.from("products").insert({
    title,
    description,
    price_usdc,
    agent_id: user.id,
  }).select();

  if (result.error?.code === "23503") {
    return { data: null, error: { message: "User profile not found. Please reconnect your wallet." } };
  }

  return { data: result.data, error: result.error };
}

export async function getProducts() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, title, description, price_usdc, status, users:agent_id(display_name, telegram_handle, wallet_address)")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

export async function createOrder(
  productId: string,
  txHash: string,
  walletAddress: string,
  paymentCurrency: string = "USDC",
  escrowRegistration?: number
) {
  // Look up product to get provider's agent_id and escrow config
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, title, price_usdc, agent_id, escrow_duration_hours")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return { data: null, error: { message: "Product not found" } };
  }

  // Resolve wallet to user (upsert so accountless payers get a record)
  const { data: client, error: clientError } = await supabaseAdmin
    .from("users")
    .upsert({ wallet_address: walletAddress }, { onConflict: "wallet_address" })
    .select("id")
    .single();

  if (clientError || !client) {
    return { data: null, error: { message: "Failed to resolve client wallet" } };
  }

  // Determine if this order uses escrow
  const durationHours = product.escrow_duration_hours;
  const usesEscrow = escrowRegistration != null && durationHours != null && durationHours > 0;

  // Insert order — escrow orders start as 'pending_schedule' until Hedera timer is confirmed
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      product_id: productId,
      tx_hash: txHash,
      status: "paid",
      paid_at: new Date().toISOString(),
      client_id: client.id,
      escrow_registration: escrowRegistration ?? null,
      escrow_status: usesEscrow ? "pending_schedule" : "none",
    })
    .select()
    .single();

  if (orderError) {
    return { data: null, error: { message: orderError.message } };
  }

  // If payment went through escrow, create Hedera timer for auto-release
  if (usesEscrow) {
    try {
      const { scheduleId, releaseAt } = await createEscrowSchedule(
        order.id,
        durationHours
      );
      await supabaseAdmin
        .from("orders")
        .update({
          hedera_schedule_id: scheduleId,
          release_at: releaseAt.toISOString(),
          escrow_status: "active",
        })
        .eq("id", order.id);
    } catch (err) {
      // Hedera failed — order stays as 'pending_schedule' which the cron ignores.
      // This needs manual resolution or a retry mechanism.
      console.error("Failed to create Hedera escrow schedule:", err);
    }
  }

  // Notify provider via Telegram
  if (product.agent_id) {
    await notifyUser(
      product.agent_id,
      `New order for "${product.title}" (${paymentCurrency === "USDC" ? "$" : ""}${product.price_usdc} ${paymentCurrency}). Tx: ${txHash}`
    );
  }

  revalidatePath("/product");
  return { data: order, error: null };
}

export async function initiateDispute(orderId: string, walletAddress: string) {
  // Fetch order with buyer's wallet for verification
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, escrow_status, hedera_schedule_id, client_id, product_id, users:client_id(wallet_address)")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { error: { message: "Order not found" } };
  }

  // Verify caller is the buyer
  const buyerWallet = (order.users as { wallet_address: string } | null)?.wallet_address;
  if (!buyerWallet || buyerWallet.toLowerCase() !== walletAddress.toLowerCase()) {
    return { error: { message: "Not authorized to dispute this order" } };
  }

  // Atomically claim the dispute — only if still active (prevents race with cron release)
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("orders")
    .update({
      escrow_status: "disputed",
      dispute_initiated_at: new Date().toISOString(),
      dispute_initiated_by: walletAddress,
    })
    .eq("id", orderId)
    .eq("escrow_status", "active")
    .select("id")
    .single();

  if (claimError || !claimed) {
    return { error: { message: "Order is not in active escrow (may already be released or disputed)" } };
  }

  // Cancel the Hedera schedule — best-effort (schedule may have already executed,
  // but we already atomically set status to 'disputed' above so the cron won't release)
  if (order.hedera_schedule_id) {
    try {
      await cancelEscrowSchedule(order.hedera_schedule_id);
    } catch (err) {
      // Schedule may have already executed or been deleted — that's fine,
      // the DB status is already 'disputed' which blocks the cron from releasing
      console.error("Hedera schedule cancel failed (may already be executed):", err);
    }
  }

  // Notify product owner about the dispute
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("agent_id, title")
    .eq("id", order.product_id!)
    .single();

  if (product?.agent_id) {
    await notifyUser(
      product.agent_id,
      `Dispute initiated on order for "${product.title}" by ${walletAddress}`
    );
  }

  revalidatePath("/product");
  return { error: null };
}
