import hre from "hardhat";
import { createClient } from "@supabase/supabase-js";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// ── Config ──────────────────────────────────────────────────────────────────
const ESCROW_ADDRESS = "0x8F1D7b515d8cA3Ce894E2CCFC9ee74B3ff8cA584";
const TRANSACTION_ID = "c49532ef-16fc-48af-82cc-b633b0f1baa1";
const REGISTRATION = 4;

const SUPABASE_URL = "https://rjywhvxntptqwofymgqg.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const ERC8004_IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const ERC8004_REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";

const IDENTITY_ABI = parseAbi([
  "function register(string agentURI) external returns (uint256)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);

const REPUTATION_ABI = parseAbi([
  "function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash) external",
  "function getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2) external view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)",
]);

// ── Helpers ─────────────────────────────────────────────────────────────────
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
function green(s: string) { return `${GREEN}${s}${RESET}`; }

function powerLaw(amount: number): number {
  return Math.round(Math.pow(amount, 0.3) * 3);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const [signer] = await hre.ethers.getSigners();
  const escrow = await hre.ethers.getContractAt("SobekEscrow", ESCROW_ADDRESS, signer);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log("=== ERC-8004 Integration Test ===\n");

  // Step 1: Release escrow on-chain (skip if already released)
  console.log("[1/5] Checking escrow state...");
  const escrowData = await escrow.escrows(REGISTRATION);
  if (escrowData[3] === 0n) {
    console.log("  Escrow already released on-chain — skipping release tx");
  } else {
    console.log("  Releasing escrow on-chain...");
    const tx = await escrow.releaseToReceiver(REGISTRATION);
    const receipt = await tx.wait();
    console.log("  tx:", green(receipt!.hash));
  }

  // Step 2: Update transaction in Supabase
  console.log("\n[2/5] Updating transaction in Supabase...");
  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      escrow_status: "released",
      escrow_resolved_at: new Date().toISOString(),
    })
    .eq("id", TRANSACTION_ID);

  if (updateError) throw new Error(`DB update failed: ${updateError.message}`);
  console.log("  transaction status: released");

  // Step 3: Look up seller
  console.log("\n[3/5] Looking up seller...");
  const { data: transaction } = await supabase
    .from("transactions")
    .select("product_id")
    .eq("id", ORDER_ID)
    .single();

  const { data: product } = await supabase
    .from("products")
    .select("agent_id, price_usdc")
    .eq("id", transaction!.product_id!)
    .single();

  const { data: seller } = await supabase
    .from("users")
    .select("id, wallet_address, erc8004_agent_id")
    .eq("id", product!.agent_id!)
    .single();

  console.log("  seller:", seller!.wallet_address);
  console.log("  price_usdc:", product!.price_usdc);
  console.log("  existing erc8004_agent_id:", seller!.erc8004_agent_id);

  // Step 4: ERC-8004 — register agent if needed, then give feedback
  // Get private key from hardhat config (same key used by the signer)
  const networkConfig = hre.config.networks.baseSepolia as { accounts: string[] };
  const privateKey = networkConfig.accounts[0];
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const transport = http();
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport });
  const publicClient = createPublicClient({ chain: baseSepolia, transport });

  let agentId: bigint;

  // Use a dead address as the transfer target — avoids self-feedback.
  // In production the NFT goes to the seller's real wallet.
  const DEAD_ADDR = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;

  if (seller!.erc8004_agent_id != null) {
    agentId = BigInt(seller!.erc8004_agent_id);
    console.log("\n[4/5] Agent already registered, agentId:", agentId.toString());
  } else {
    console.log("\n[4/5] Registering agent on ERC-8004 Identity Registry...");
    const agentURI = `sobek:seller:${seller!.wallet_address}`;
    console.log("  agentURI:", agentURI);

    const regHash = await walletClient.writeContract({
      address: ERC8004_IDENTITY_REGISTRY as `0x${string}`,
      abi: IDENTITY_ABI,
      functionName: "register",
      args: [agentURI],
    });

    const regReceipt = await publicClient.waitForTransactionReceipt({ hash: regHash });
    console.log("  register tx:", green(regHash));

    if (regReceipt.status === "reverted") throw new Error("register() reverted");

    // Parse Transfer event for tokenId
    for (const log of regReceipt.logs) {
      if (log.address.toLowerCase() !== ERC8004_IDENTITY_REGISTRY.toLowerCase()) continue;
      if (log.topics.length >= 4 && log.topics[3]) {
        agentId = BigInt(log.topics[3]);
        break;
      }
    }

    if (!agentId!) throw new Error("No Transfer event found");
    console.log("  agentId:", green(agentId!.toString()));

    // Transfer NFT to seller (avoids self-feedback block)
    console.log("  transferring NFT to seller wallet...");
    const xferHash = await walletClient.writeContract({
      address: ERC8004_IDENTITY_REGISTRY as `0x${string}`,
      abi: IDENTITY_ABI,
      functionName: "transferFrom",
      args: [account.address, DEAD_ADDR, agentId!],
    });
    const xferReceipt = await publicClient.waitForTransactionReceipt({ hash: xferHash });
    if (xferReceipt.status === "reverted") throw new Error("transferFrom() reverted");
    console.log("  transfer tx:", green(xferHash));

    // Store in DB
    await supabase
      .from("users")
      .update({ erc8004_agent_id: Number(agentId!) })
      .eq("id", seller!.id);
    console.log("  stored erc8004_agent_id in DB");
  }

  // Step 5: Give feedback
  console.log("\n[5/5] Posting feedback on ERC-8004 Reputation Registry...");
  const delta = powerLaw(product!.price_usdc);
  console.log("  delta (rep points):", delta);

  const fbHash = await walletClient.writeContract({
    address: ERC8004_REPUTATION_REGISTRY as `0x${string}`,
    abi: REPUTATION_ABI,
    functionName: "giveFeedback",
    args: [
      agentId!,
      BigInt(delta),
      0,
      "sobek",
      "escrow-release",
      "",
      "",
      "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
    ],
  });

  const fbReceipt = await publicClient.waitForTransactionReceipt({ hash: fbHash });
  console.log("  tx:", green(fbHash));
  if (fbReceipt.status === "reverted") throw new Error("giveFeedback() reverted");

  // Verify: read summary
  console.log("\n=== Verification ===");
  const [count, summaryValue, decimals] = await publicClient.readContract({
    address: ERC8004_REPUTATION_REGISTRY as `0x${string}`,
    abi: REPUTATION_ABI,
    functionName: "getSummary",
    args: [agentId!, [account.address], "sobek", ""],
  });

  console.log("  getSummary (tag1=sobek, tag2=''):");
  console.log("    count:", count.toString());
  console.log("    summaryValue:", summaryValue.toString());
  console.log("    decimals:", decimals);

  // Check DB
  const { data: updatedSeller } = await supabase
    .from("users")
    .select("erc8004_agent_id")
    .eq("id", seller!.id)
    .single();

  console.log("  DB erc8004_agent_id:", updatedSeller?.erc8004_agent_id);

  console.log("\n" + green("✓ ERC-8004 integration test complete!"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
