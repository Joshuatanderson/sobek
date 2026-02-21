/**
 * Test script: insert a positive reputation event and log it to Hedera HCS.
 * Verifies the full flow: HCS submission → sequence number → DB storage → trigger recompute.
 *
 * Usage: bunx tsx scripts/test-hcs-reputation.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Target wallet — the seller wallet that already has negative rep events
const SELLER_WALLET = "0xF0E55844C54881f12ED7955C7Bb720658bC376c6";

async function main() {
  // 1. Pick an existing released transaction for this seller to use as reference
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", SELLER_WALLET)
    .single();

  if (!user) {
    console.error("Seller user not found");
    process.exit(1);
  }

  // Find a released transaction for this seller
  const { data: products } = await supabase
    .from("products")
    .select("id, price_usdc")
    .eq("agent_id", user.id);

  let transactionId: string | null = null;
  let amountUsd = 10; // default test amount

  if (products && products.length > 0) {
    const productIds = products.map((p) => p.id);
    const { data: txns } = await supabase
      .from("transactions")
      .select("id, product_id")
      .in("product_id", productIds)
      .eq("escrow_status", "released")
      .limit(1);

    if (txns && txns.length > 0) {
      transactionId = txns[0].id;
      const prod = products.find((p) => p.id === txns[0].product_id);
      if (prod) amountUsd = prod.price_usdc;
    }
  }

  // If no released transaction exists, create a fake one for testing
  if (!transactionId) {
    console.log("No released transaction found, creating a test one...");
    const { data: testProduct } = await supabase
      .from("products")
      .select("id, price_usdc")
      .eq("agent_id", user.id)
      .limit(1)
      .single();

    if (!testProduct) {
      console.error("No products found for this seller");
      process.exit(1);
    }

    amountUsd = testProduct.price_usdc;

    const { data: testTx, error: txErr } = await supabase
      .from("transactions")
      .insert({
        product_id: testProduct.id,
        status: "paid",
        escrow_status: "released",
        paid_at: new Date().toISOString(),
        client_id: user.id, // self-buy for testing
        chain_id: 84532, // Base Sepolia
        tx_hash: "0xTEST_HCS_REPUTATION_" + Date.now(),
        escrow_resolved_to: SELLER_WALLET,
        escrow_resolved_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (txErr || !testTx) {
      console.error("Failed to create test transaction:", txErr);
      process.exit(1);
    }

    transactionId = testTx.id;
    console.log("Created test transaction:", transactionId);
  }

  // 2. Calculate positive reputation delta (same as cron: powerLaw(3))
  const delta = Math.round(Math.pow(amountUsd, 0.3) * 3);
  console.log(`Amount: $${amountUsd}, delta: +${delta}`);

  // 3. Insert reputation event
  const { data: repEvent, error: repErr } = await supabase
    .from("reputation_events")
    .insert({
      wallet: SELLER_WALLET,
      delta,
      reason: "transaction_released",
      transaction_id: transactionId,
      amount_usd: amountUsd,
    })
    .select("id")
    .single();

  if (repErr || !repEvent) {
    console.error("Failed to insert reputation event:", repErr);
    process.exit(1);
  }

  console.log("Inserted reputation event:", repEvent.id);

  // 4. Log to Hedera HCS
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromStringECDSA(process.env.HEDRA_HEX_ENCODED_PRIVATE_KEY!)
  );

  const msg = {
    type: "reputation_event",
    wallet: SELLER_WALLET,
    delta,
    reason: "transaction_released",
    amount_usd: amountUsd,
    transaction_id: transactionId,
    timestamp: new Date().toISOString(),
  };

  console.log("Submitting to HCS topic:", process.env.HEDERA_REPUTATION_TOPIC_ID);
  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(process.env.HEDERA_REPUTATION_TOPIC_ID!)
    .setMessage(JSON.stringify(msg));

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);
  const sequenceNumber = Number(receipt.topicSequenceNumber);

  console.log("HCS sequence number:", sequenceNumber);

  // 5. Store sequence number back in DB
  const { error: updateErr } = await supabase
    .from("reputation_events")
    .update({ hcs_sequence: sequenceNumber })
    .eq("id", repEvent.id);

  if (updateErr) {
    console.error("Failed to store HCS sequence:", updateErr);
  } else {
    console.log("Stored hcs_sequence in reputation_events row", repEvent.id);
  }

  // 6. Check the trigger-recomputed reputation_sum
  const { data: updatedUser } = await supabase
    .from("users")
    .select("reputation_sum")
    .eq("wallet_address", SELLER_WALLET)
    .single();

  console.log("\nFinal reputation_sum:", updatedUser?.reputation_sum);

  // 7. Verify on Hedera mirror node
  console.log(
    `\nVerify on Hedera mirror: https://testnet.mirrornode.hedera.com/api/v1/topics/${process.env.HEDERA_REPUTATION_TOPIC_ID}/messages/${sequenceNumber}`
  );

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
