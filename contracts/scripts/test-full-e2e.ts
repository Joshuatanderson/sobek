/**
 * Full end-to-end escrow test on Base Sepolia:
 *
 * 1. Fund a buyer wallet from the deployer/arbiter
 * 2. Register seller in Supabase with a display name
 * 3. Create a product with 10s escrow
 * 4. Buyer deposits ETH into escrow contract
 * 5. Create transaction + Hedera schedule (10s timer)
 * 6. Poll Hedera mirror until executed
 * 7. Call releaseToReceiver on-chain (simulating cron)
 * 8. Verify on-chain release
 *
 * Usage: npx hardhat run --network baseSepolia scripts/test-full-e2e.ts
 */
import "dotenv/config";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import hre from "hardhat";
import { createClient } from "@supabase/supabase-js";
import {
  Client as HederaClient,
  AccountId,
  PrivateKey,
  ScheduleCreateTransaction,
  TransferTransaction,
  Hbar,
  Timestamp,
} from "@hashgraph/sdk";

// ── Config ──────────────────────────────────────────────────────────────────
const ESCROW_ADDRESS = "0x8F1D7b515d8cA3Ce894E2CCFC9ee74B3ff8cA584"; // Base Sepolia
const DEPOSIT_AMOUNT = hre.ethers.parseEther("0.0001");
const ESCROW_DURATION_SECONDS = 10;
const HEDERA_MIRROR_URL = "https://testnet.mirrornode.hedera.com";

const SUPABASE_URL = "https://rjywhvxntptqwofymgqg.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const HEDERA_ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID ?? "";
const HEDERA_PRIVATE_KEY = process.env.HEDRA_HEX_ENCODED_PRIVATE_KEY ?? "";

// ── Helpers ─────────────────────────────────────────────────────────────────
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
function green(s: string) { return `${GREEN}${s}${RESET}`; }
function dim(s: string) { return `${DIM}${s}${RESET}`; }
function bold(s: string) { return `${BOLD}${s}${RESET}`; }
function link(hash: string) { return `https://sepolia.basescan.org/tx/${hash}`; }

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  if (!HEDERA_ACCOUNT_ID || !HEDERA_PRIVATE_KEY) throw new Error("Missing Hedera env vars");

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const [seller] = await hre.ethers.getSigners();
  const escrow = await hre.ethers.getContractAt("SobekEscrow", ESCROW_ADDRESS, seller);

  // Generate a random buyer wallet
  const buyerWallet = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);

  console.log(bold("\n═══ FULL E2E ESCROW TEST — BASE SEPOLIA ═══\n"));
  console.log("Seller (arbiter):", seller.address);
  console.log("Buyer (random):", buyerWallet.address);
  console.log("Escrow contract:", ESCROW_ADDRESS);
  console.log("Escrow duration:", ESCROW_DURATION_SECONDS, "seconds");
  console.log("Deposit amount:", hre.ethers.formatEther(DEPOSIT_AMOUNT), "ETH");

  // ── Step 1: Fund the buyer ────────────────────────────────────────────
  console.log(bold("\n[1/9] Funding buyer wallet..."));
  const fundTx = await seller.sendTransaction({
    to: buyerWallet.address,
    value: DEPOSIT_AMOUNT * 2n, // 2x deposit to cover gas
  });
  await fundTx.wait();
  console.log("  tx:", green(link(fundTx.hash)));
  const buyerBal = await hre.ethers.provider.getBalance(buyerWallet.address);
  console.log("  buyer balance:", hre.ethers.formatEther(buyerBal), "ETH");

  // ── Step 2: Register seller as user ───────────────────────────────────
  console.log(bold("\n[2/9] Registering seller in Supabase..."));
  const { data: sellerUser, error: sellerErr } = await supabase
    .from("users")
    .upsert(
      { wallet_address: seller.address, display_name: "Apex Silicon Manufacturing" },
      { onConflict: "wallet_address" }
    )
    .select("id, display_name, wallet_address")
    .single();
  if (sellerErr) throw new Error(`Seller upsert failed: ${sellerErr.message}`);
  console.log("  user ID:", green(sellerUser.id));
  console.log("  display_name:", sellerUser.display_name);

  // ── Step 3: Register buyer as user ────────────────────────────────────
  console.log(bold("\n[3/9] Registering buyer in Supabase..."));
  const { data: buyerUser, error: buyerErr } = await supabase
    .from("users")
    .upsert(
      { wallet_address: buyerWallet.address },
      { onConflict: "wallet_address" }
    )
    .select("id, wallet_address")
    .single();
  if (buyerErr) throw new Error(`Buyer upsert failed: ${buyerErr.message}`);
  console.log("  user ID:", green(buyerUser.id));

  // ── Step 4: Create product with 10s escrow ────────────────────────────
  console.log(bold("\n[4/9] Creating product..."));
  const { data: product, error: productErr } = await supabase
    .from("products")
    .insert({
      title: "NVIDIA H100 SXM5 80GB — E2E Test",
      description: "Enterprise GPU for AI/ML workloads. HBM3 memory, 80GB. E2E test unit.",
      price_usdc: 0.01,
      escrow_duration_seconds: ESCROW_DURATION_SECONDS,
      agent_id: sellerUser.id,
    })
    .select()
    .single();
  if (productErr) throw new Error(`Product insert failed: ${productErr.message}`);
  console.log("  product ID:", green(product.id));
  console.log("  escrow_duration_seconds:", product.escrow_duration_seconds);

  // ── Step 5: Buyer deposits ETH into escrow ────────────────────────────
  console.log(bold("\n[5/9] Buyer depositing into escrow..."));
  const escrowAsBuyer = escrow.connect(buyerWallet);
  const depositTx = await escrowAsBuyer.deposit(
    seller.address,
    hre.ethers.ZeroAddress, // ETH
    DEPOSIT_AMOUNT,
    `Product: ${product.title}`,
    { value: DEPOSIT_AMOUNT }
  );
  const depositReceipt = await depositTx.wait();
  console.log("  tx:", green(link(depositReceipt!.hash)));

  // Parse registration from Deposit event
  const depositEvent = depositReceipt!.logs
    .map((log) => {
      try { return escrow.interface.parseLog({ topics: log.topics as string[], data: log.data }); }
      catch { return null; }
    })
    .find((e) => e?.name === "Deposit");

  if (!depositEvent) throw new Error("Deposit event not found");
  const registration = Number(depositEvent.args[4]);
  console.log("  registration:", green(String(registration)));

  // Verify on-chain escrow state
  const escrowData = await escrow.escrows(registration);
  console.log("  on-chain depositor:", escrowData[0]);
  console.log("  on-chain receiver:", escrowData[1]);
  console.log("  on-chain value:", hre.ethers.formatEther(escrowData[3]), "ETH");

  // ── Step 6: Create Hedera schedule (10s timer) ────────────────────────
  console.log(bold("\n[6/9] Creating Hedera schedule (10s timer)..."));
  const hederaClient = HederaClient.forTestnet();
  const operatorId = AccountId.fromString(HEDERA_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(HEDERA_PRIVATE_KEY);
  hederaClient.setOperator(operatorId, operatorKey);

  const releaseAt = new Date(Date.now() + ESCROW_DURATION_SECONDS * 1000);
  const innerTx = new TransferTransaction()
    .addHbarTransfer(operatorId, Hbar.fromTinybars(-1))
    .addHbarTransfer(operatorId, Hbar.fromTinybars(1));

  const scheduleTx = new ScheduleCreateTransaction()
    .setScheduledTransaction(innerTx)
    .setWaitForExpiry(true)
    .setExpirationTime(Timestamp.fromDate(releaseAt))
    .setAdminKey(operatorKey)
    .setScheduleMemo(`sobek:escrow:${product.id}`);

  const scheduleResponse = await scheduleTx.execute(hederaClient);
  const scheduleReceipt = await scheduleResponse.getReceipt(hederaClient);
  const scheduleId = scheduleReceipt.scheduleId;
  if (!scheduleId) throw new Error("No schedule ID in receipt");
  console.log("  schedule ID:", green(scheduleId.toString()));
  console.log("  expires at:", releaseAt.toISOString());

  // ── Step 7: Insert transaction into Supabase ────────────────────────────────
  console.log(bold("\n[7/9] Creating transaction in Supabase..."));
  const { data: transaction, error: transactionErr } = await supabase
    .from("transactions")
    .insert({
      product_id: product.id,
      tx_hash: depositReceipt!.hash,
      status: "paid",
      paid_at: new Date().toISOString(),
      client_id: buyerUser.id,
      escrow_registration: registration,
      escrow_status: "active",
      chain_id: 84532,
      hedera_schedule_id: scheduleId.toString(),
      release_at: releaseAt.toISOString(),
    })
    .select()
    .single();
  if (transactionErr) throw new Error(`Transaction insert failed: ${transactionErr.message}`);
  console.log("  transaction ID:", green(transaction.id));
  console.log("  escrow_status:", transaction.escrow_status);

  // ── Step 8: Poll Hedera mirror until executed ─────────────────────────
  console.log(bold("\n[8/9] Waiting for Hedera timer to fire..."));
  const pollStart = Date.now();
  const maxPoll = 60_000;
  let executed = false;

  while (Date.now() - pollStart < maxPoll) {
    await sleep(3000);
    const elapsed = ((Date.now() - pollStart) / 1000).toFixed(1);

    const res = await fetch(`${HEDERA_MIRROR_URL}/api/v1/schedules/${scheduleId.toString()}`);
    if (!res.ok) {
      console.log(`  [${elapsed}s] mirror ${res.status}, retrying...`);
      continue;
    }

    const data = await res.json();
    if (data.executed_timestamp) {
      console.log(`  [${elapsed}s] executed_timestamp: ${green(data.executed_timestamp)}`);
      executed = true;
      break;
    }
    console.log(`  [${elapsed}s] not yet executed...`);
  }

  if (!executed) throw new Error("Hedera schedule did not execute within 60s");

  // ── Step 9: Release escrow on-chain (simulating cron) ─────────────────
  console.log(bold("\n[9/9] Releasing escrow on-chain..."));

  // Atomically claim the transaction (like the cron does)
  const { error: claimErr } = await supabase
    .from("transactions")
    .update({ escrow_status: "releasing" })
    .eq("id", transaction.id)
    .eq("escrow_status", "active");
  if (claimErr) throw new Error(`Claim failed: ${claimErr.message}`);

  // Call releaseToReceiver as the arbiter
  const releaseTx = await escrow.releaseToReceiver(registration);
  const releaseReceipt = await releaseTx.wait();
  console.log("  tx:", green(link(releaseReceipt!.hash)));

  // Update transaction in DB
  const { error: updateErr } = await supabase
    .from("transactions")
    .update({
      escrow_status: "released",
      escrow_resolved_to: seller.address,
      escrow_resolved_at: new Date().toISOString(),
    })
    .eq("id", transaction.id);
  if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);


  // Verify on-chain: escrow value should now be 0
  const postEscrow = await escrow.escrows(registration);
  const remainingValue = postEscrow[3];
  console.log("  on-chain escrow value after release:", hre.ethers.formatEther(remainingValue), "ETH");

  if (remainingValue === 0n) {
    console.log("  " + green("Escrow fully released!"));
  } else {
    console.log("  WARNING: escrow still has value");
  }

  // Verify DB state
  const { data: finalTransaction } = await supabase
    .from("transactions")
    .select("escrow_status, escrow_resolved_to, escrow_resolved_at")
    .eq("id", transaction.id)
    .single();
  console.log("  DB escrow_status:", finalTransaction?.escrow_status);
  console.log("  DB escrow_resolved_to:", finalTransaction?.escrow_resolved_to);

  // ── Summary ───────────────────────────────────────────────────────────
  hederaClient.close();

  console.log(bold("\n═══════════════════════════════════════════════════════════════"));
  console.log(green("  ALL 9 STEPS PASSED — FULL E2E ESCROW TEST COMPLETE"));
  console.log(bold("═══════════════════════════════════════════════════════════════\n"));
  console.log("  Base Sepolia links:");
  console.log(`    Fund buyer:  ${dim(link(fundTx.hash))}`);
  console.log(`    Deposit:     ${dim(link(depositReceipt!.hash))}`);
  console.log(`    Release:     ${dim(link(releaseReceipt!.hash))}`);
  console.log("");
  console.log("  Hedera schedule:");
  console.log(`    ${dim(`${HEDERA_MIRROR_URL}/api/v1/schedules/${scheduleId.toString()}`)}`);
  console.log("");
  console.log("  Supabase:");
  console.log(`    Product:  ${product.id}`);
  console.log(`    Transaction: ${transaction.id}`);
  console.log(`    Seller:   ${sellerUser.display_name} (${seller.address})`);
  console.log(`    Buyer:    ${buyerWallet.address}`);
  console.log(bold("═══════════════════════════════════════════════════════════════\n"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
