import hre from "hardhat";
import { createClient } from "@supabase/supabase-js";

// ── Config ──────────────────────────────────────────────────────────────────
const ESCROW_ADDRESS = "0x8F1D7b515d8cA3Ce894E2CCFC9ee74B3ff8cA584"; // Base Sepolia
const DEPOSIT_AMOUNT = hre.ethers.parseEther("0.0001"); // tiny ETH for testing

// Pick one of the cheap test products (not the $4k one!)
const PRODUCT_ID = "eaa588b0-7474-4276-a9f5-0caaaf243cd6"; // "Get a high five" — $0.01
const RECEIVER = "0xcdd46667E9Ce3db1Bd978DF806479BBE615E0523"; // product owner wallet

// Supabase (uses service role for direct DB access)
const SUPABASE_URL = "https://rjywhvxntptqwofymgqg.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// ── Helpers ─────────────────────────────────────────────────────────────────
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";

function green(s: string) { return `${GREEN}${s}${RESET}`; }
function dim(s: string) { return `${DIM}${s}${RESET}`; }

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const [signer] = await hre.ethers.getSigners();
  const escrow = await hre.ethers.getContractAt("SobekEscrow", ESCROW_ADDRESS, signer);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log("Signer (arbiter):", signer.address);
  console.log("Escrow contract:", ESCROW_ADDRESS);
  console.log("Product ID:", PRODUCT_ID);
  console.log("Receiver:", RECEIVER);
  console.log("Deposit:", hre.ethers.formatEther(DEPOSIT_AMOUNT), "ETH");

  // Verify contract config
  const platformWallet = await escrow.platformWallet();
  const feeBps = await escrow.platformFeeBps();
  console.log(`\nPlatform wallet: ${platformWallet}`);
  console.log(`Fee: ${feeBps.toString()} bps (${Number(feeBps) / 100}%)`);

  // ── Step 1: Deposit ETH into escrow ─────────────────────────────────────
  console.log("\n[1/3] Depositing into escrow...");
  const tx = await escrow.deposit(
    RECEIVER,
    hre.ethers.ZeroAddress, // ETH (no ERC-20 token on Sepolia)
    DEPOSIT_AMOUNT,
    `e2e-test:product:${PRODUCT_ID}`,
    { value: DEPOSIT_AMOUNT }
  );
  const receipt = await tx.wait();
  console.log("  tx:", green(receipt!.hash));

  // Parse Deposit event to get registration index
  const depositEvent = receipt!.logs
    .map((log) => {
      try { return escrow.interface.parseLog({ topics: log.topics as string[], data: log.data }); }
      catch { return null; }
    })
    .find((e) => e?.name === "Deposit");

  if (!depositEvent) throw new Error("Deposit event not found in receipt");

  const registration = Number(depositEvent.args[4]); // 5th arg = registration
  console.log("  registration:", green(String(registration)));
  console.log(`  BaseScan: ${dim(`https://sepolia.basescan.org/tx/${receipt!.hash}`)}`);

  // ── Step 2: Create transaction in Supabase ────────────────────────────────────
  console.log("\n[2/3] Creating transaction in Supabase...");

  // Upsert the wallet as a user (accountless payer flow)
  const { data: client, error: clientError } = await supabase
    .from("users")
    .upsert({ wallet_address: signer.address }, { onConflict: "wallet_address" })
    .select("id")
    .single();

  if (clientError || !client) {
    throw new Error(`Failed to resolve client: ${clientError?.message}`);
  }

  // Insert transaction with escrow fields
  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert({
      product_id: PRODUCT_ID,
      tx_hash: receipt!.hash,
      status: "paid",
      paid_at: new Date().toISOString(),
      client_id: client.id,
      escrow_registration: registration,
      chain_id: 84532, // Base Sepolia
      escrow_status: "active", // skipping Hedera schedule for Sepolia test
      release_at: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1h from now
    })
    .select()
    .single();

  if (transactionError) throw new Error(`Transaction insert failed: ${transactionError.message}`);

  console.log("  transaction ID:", green(transaction.id));
  console.log("  escrow_status:", transaction.escrow_status);
  console.log("  release_at:", transaction.release_at);

  // ── Step 3: Verify on-chain state ───────────────────────────────────────
  console.log("\n[3/3] Verifying on-chain escrow state...");
  const escrowData = await escrow.escrows(registration);
  console.log("  depositor:", escrowData[0]);
  console.log("  receiver:", escrowData[1]);
  console.log("  token:", escrowData[2] === hre.ethers.ZeroAddress ? "ETH" : escrowData[2]);
  console.log("  value:", hre.ethers.formatEther(escrowData[3]), "ETH");

  const contractBal = await hre.ethers.provider.getBalance(ESCROW_ADDRESS);
  console.log("  contract balance:", hre.ethers.formatEther(contractBal), "ETH");

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log(green("✓ E2E escrow test complete on Base Sepolia"));
  console.log("═".repeat(60));
  console.log(`  Contract:     ${ESCROW_ADDRESS}`);
  console.log(`  Registration: ${registration}`);
  console.log(`  Transaction:  ${transaction.id}`);
  console.log(`  Tx:           https://sepolia.basescan.org/tx/${receipt!.hash}`);
  console.log("");
  console.log("  To release manually:");
  console.log(`    npx hardhat run --network baseSepolia scripts/test-release.ts`);
  console.log("═".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
