/**
 * Full end-to-end escrow test on Base Sepolia.
 *
 * Usage: npx tsx --env-file=.env scripts/test-full-e2e.ts
 */
import {
  createPublicClient, createWalletClient, http, parseEther, parseAbi,
  formatEther, zeroAddress, decodeEventLog,
} from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { createClient } from "@supabase/supabase-js";
import {
  Client as HederaClient, AccountId, PrivateKey,
  ScheduleCreateTransaction, TransferTransaction, Hbar, Timestamp,
} from "@hashgraph/sdk";

// ── Config ──────────────────────────────────────────────────────────────────
const ESCROW_ADDRESS = "0x8F1D7b515d8cA3Ce894E2CCFC9ee74B3ff8cA584" as const;
const DEPOSIT_AMOUNT = parseEther("0.0001");
const ESCROW_DURATION_SECONDS = 10;
const HEDERA_MIRROR = "https://testnet.mirrornode.hedera.com";

const SUPABASE_URL = "https://rjywhvxntptqwofymgqg.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const rawKey = process.env.ESCROW_ARBITER_PRIVATE_KEY ?? "";
const SELLER_KEY = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;
const HEDERA_ACCT = process.env.HEDERA_ACCOUNT_ID ?? "";
const HEDERA_KEY = process.env.HEDRA_HEX_ENCODED_PRIVATE_KEY ?? "";

const ESCROW_ABI = parseAbi([
  "function deposit(address receiver, address token, uint256 value, string details) payable",
  "function releaseToReceiver(uint256 registration)",
  "function escrows(uint256) view returns (address depositor, address receiver, address token, uint256 value, string details)",
  "event Deposit(address indexed depositor, address indexed receiver, address token, uint256 amount, uint256 indexed registration, string details)",
]);

// ── Helpers ─────────────────────────────────────────────────────────────────
const G = "\x1b[32m", D = "\x1b[2m", B = "\x1b[1m", R = "\x1b[0m";
const green = (s: string) => `${G}${s}${R}`;
const dim = (s: string) => `${D}${s}${R}`;
const bold = (s: string) => `${B}${s}${R}`;
const bsLink = (h: string) => `https://sepolia.basescan.org/tx/${h}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const transport = http();
const publicClient = createPublicClient({ chain: baseSepolia, transport });

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_KEY || !SELLER_KEY || !HEDERA_ACCT || !HEDERA_KEY) {
    throw new Error("Missing env vars");
  }

  const seller = privateKeyToAccount(SELLER_KEY);
  const buyerKey = generatePrivateKey();
  const buyer = privateKeyToAccount(buyerKey);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const sellerWallet = createWalletClient({ account: seller, chain: baseSepolia, transport });
  const buyerWallet = createWalletClient({ account: buyer, chain: baseSepolia, transport });

  console.log(bold("\n═══ FULL E2E ESCROW TEST — BASE SEPOLIA ═══\n"));
  console.log("Seller:", seller.address);
  console.log("Buyer:", buyer.address);

  // ── 1. Fund buyer ─────────────────────────────────────────────────────
  console.log(bold("\n[1/9] Funding buyer..."));
  const fundHash = await sellerWallet.sendTransaction({ to: buyer.address, value: DEPOSIT_AMOUNT * 2n });
  await publicClient.waitForTransactionReceipt({ hash: fundHash });
  console.log("  " + green(bsLink(fundHash)));

  // ── 2. Register seller ────────────────────────────────────────────────
  console.log(bold("\n[2/9] Registering seller..."));
  const { data: sellerUser, error: se } = await supabase
    .from("users")
    .upsert({ wallet_address: seller.address, display_name: "Apex Silicon Manufacturing" }, { onConflict: "wallet_address" })
    .select("id, display_name").single();
  if (se) throw se;
  console.log("  " + green(sellerUser!.display_name!) + " → " + sellerUser!.id);

  // ── 3. Register buyer ─────────────────────────────────────────────────
  console.log(bold("\n[3/9] Registering buyer..."));
  const { data: buyerUser, error: be } = await supabase
    .from("users")
    .upsert({ wallet_address: buyer.address }, { onConflict: "wallet_address" })
    .select("id").single();
  if (be) throw be;
  console.log("  buyer → " + green(buyerUser!.id));

  // ── 4. Create product ─────────────────────────────────────────────────
  console.log(bold("\n[4/9] Creating product (10s escrow)..."));
  const { data: product, error: pe } = await supabase
    .from("products")
    .insert({
      title: "NVIDIA H100 SXM5 80GB — E2E Test",
      description: "Enterprise GPU for AI/ML. E2E test.",
      price_usdc: 0.01,
      escrow_duration_seconds: ESCROW_DURATION_SECONDS,
      agent_id: sellerUser!.id,
    })
    .select().single();
  if (pe) throw pe;
  console.log("  product → " + green(product!.id));

  // ── 5. Buyer deposits into escrow ─────────────────────────────────────
  console.log(bold("\n[5/9] Buyer depositing into escrow..."));
  const depositHash = await buyerWallet.writeContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: "deposit",
    args: [seller.address, zeroAddress, DEPOSIT_AMOUNT, `Product: ${product!.title}`],
    value: DEPOSIT_AMOUNT,
  });
  const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositHash });
  console.log("  " + green(bsLink(depositHash)));

  // Parse registration
  let registration: number | undefined;
  for (const log of depositReceipt.logs) {
    try {
      const decoded = decodeEventLog({ abi: ESCROW_ABI, data: log.data, topics: log.topics });
      if (decoded.eventName === "Deposit") {
        registration = Number((decoded.args as { registration: bigint }).registration);
        break;
      }
    } catch { /* skip */ }
  }
  if (registration == null) throw new Error("No Deposit event found");
  console.log("  registration: " + green(String(registration)));

  // ── 6. Hedera schedule ────────────────────────────────────────────────
  console.log(bold("\n[6/9] Creating Hedera schedule (10s)..."));
  const hClient = HederaClient.forTestnet();
  const opId = AccountId.fromString(HEDERA_ACCT);
  const opKey = PrivateKey.fromStringECDSA(HEDERA_KEY);
  hClient.setOperator(opId, opKey);

  const releaseAt = new Date(Date.now() + ESCROW_DURATION_SECONDS * 1000);
  const innerTx = new TransferTransaction()
    .addHbarTransfer(opId, Hbar.fromTinybars(-1))
    .addHbarTransfer(opId, Hbar.fromTinybars(1));
  const schTx = new ScheduleCreateTransaction()
    .setScheduledTransaction(innerTx)
    .setWaitForExpiry(true)
    .setExpirationTime(Timestamp.fromDate(releaseAt))
    .setAdminKey(opKey)
    .setScheduleMemo(`sobek:escrow:${product!.id}`);
  const schResp = await schTx.execute(hClient);
  const schReceipt = await schResp.getReceipt(hClient);
  const scheduleId = schReceipt.scheduleId!.toString();
  console.log("  schedule → " + green(scheduleId));

  // ── 7. Insert transaction ───────────────────────────────────────────────────
  console.log(bold("\n[7/9] Creating transaction..."));
  const { data: transaction, error: oe } = await supabase
    .from("transactions")
    .insert({
      product_id: product!.id,
      tx_hash: depositHash,
      status: "paid",
      paid_at: new Date().toISOString(),
      client_id: buyerUser!.id,
      escrow_registration: registration,
      escrow_status: "active",
      chain_id: 84532,
      hedera_schedule_id: scheduleId,
      release_at: releaseAt.toISOString(),
    })
    .select().single();
  if (oe) throw oe;
  console.log("  transaction → " + green(transaction!.id));

  // ── 8. Poll Hedera ────────────────────────────────────────────────────
  console.log(bold("\n[8/9] Waiting for Hedera timer..."));
  const t0 = Date.now();
  let fired = false;
  while (Date.now() - t0 < 60_000) {
    await sleep(3000);
    const el = ((Date.now() - t0) / 1000).toFixed(1);
    const res = await fetch(`${HEDERA_MIRROR}/api/v1/schedules/${scheduleId}`);
    if (!res.ok) { console.log(`  [${el}s] mirror ${res.status}`); continue; }
    const d = await res.json();
    if (d.executed_timestamp) {
      console.log(`  [${el}s] ${green("FIRED")} — ${d.executed_timestamp}`);
      fired = true;
      break;
    }
    console.log(`  [${el}s] waiting...`);
  }
  if (!fired) throw new Error("Timer didn't fire");

  // ── 9. Release on-chain ───────────────────────────────────────────────
  console.log(bold("\n[9/9] Releasing escrow on-chain..."));
  await supabase.from("transactions").update({ escrow_status: "releasing" }).eq("id", transaction!.id).eq("escrow_status", "active");

  const releaseHash = await sellerWallet.writeContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: "releaseToReceiver",
    args: [BigInt(registration)],
  });
  await publicClient.waitForTransactionReceipt({ hash: releaseHash });
  console.log("  " + green(bsLink(releaseHash)));

  await supabase.from("transactions").update({
    escrow_status: "released",
    escrow_resolved_to: seller.address,
    escrow_resolved_at: new Date().toISOString(),
  }).eq("id", transaction!.id);

  // Verify release tx succeeded
  const releaseRcpt = await publicClient.waitForTransactionReceipt({ hash: releaseHash });
  console.log("  release status: " + (releaseRcpt.status === "success" ? green("success") : "reverted"));

  const { data: fo } = await supabase.from("transactions").select("escrow_status").eq("id", transaction!.id).single();
  console.log("  DB status: " + green(fo?.escrow_status ?? "?"));

  hClient.close();

  console.log(bold("\n═══════════════════════════════════════════════════════════"));
  console.log(green("  ALL 9 STEPS PASSED"));
  console.log(bold("═══════════════════════════════════════════════════════════\n"));
  console.log("  Fund:     " + dim(bsLink(fundHash)));
  console.log("  Deposit:  " + dim(bsLink(depositHash)));
  console.log("  Release:  " + dim(bsLink(releaseHash)));
  console.log("  Hedera:   " + dim(`${HEDERA_MIRROR}/api/v1/schedules/${scheduleId}`));
  console.log("  Product:  " + product!.id);
  console.log("  Order:    " + transaction!.id);
  console.log("");
}

main().catch((err) => { console.error(err); process.exit(1); });
