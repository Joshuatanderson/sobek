/**
 * Programmatic agent registration — mirrors the native product creation flow:
 *   1. Upsert a user in Supabase (fresh wallet or existing)
 *   2. Create a product for that user
 *   3. Register an ERC-8004 agent NFT on-chain (with image)
 *   4. Store the agentId back in the users table
 *
 * Note: ERC-8004 Identity Registry tokens are soulbound (non-transferable).
 * The NFT is owned by the arbiter wallet that mints it.
 *
 * Usage: bun --env-file=.env scripts/register-agent.ts
 */

import { createClient } from "@supabase/supabase-js";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// --- Config (mirrors config/constants.ts) ---
const ERC8004_IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";

const IDENTITY_ABI = parseAbi([
  "function register(string agentURI) external returns (uint256)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);

// --- Env ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ARBITER_PK = process.env.ESCROW_ARBITER_PRIVATE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ARBITER_PK) {
  throw new Error("Missing env vars — run with: bun --env-file=.env scripts/register-agent.ts");
}

// --- Clients ---
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const arbiterAccount = privateKeyToAccount(`0x${ARBITER_PK}` as `0x${string}`);
const transport = http();
const walletClient = createWalletClient({ account: arbiterAccount, chain: baseSepolia, transport });
const publicClient = createPublicClient({ chain: baseSepolia, transport });

// --- Build metadata (mirrors lib/erc8004.ts buildAgentURI) ---
function buildAgentURI(name: string, description: string): string {
  const metadata = JSON.stringify({
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name,
    description,
    image: "https://www.callsobek.xyz/sobek-small.png",
    active: true,
    services: [],
    registrations: [],
    supportedTrust: ["reputation"],
  });
  return "data:application/json;base64," + Buffer.from(metadata).toString("base64");
}

async function main() {
  console.log("=== Sobek Agent Registration (native flow) ===\n");

  // 1. Generate a fresh wallet for this seller
  const sellerPk = generatePrivateKey();
  const sellerAccount = privateKeyToAccount(sellerPk);
  const sellerWallet = sellerAccount.address;
  console.log("[1/4] Fresh seller wallet:", sellerWallet);

  // 2. Upsert user in Supabase
  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert({ wallet_address: sellerWallet }, { onConflict: "wallet_address" })
    .select("id, wallet_address")
    .single();

  if (userError || !user) throw new Error(`User upsert failed: ${userError?.message}`);
  console.log("[2/4] User created:", user.id);

  // 3. Create a product for this user
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      title: "Sobek Voice Agent",
      description: "AI-powered voice agent for on-chain escrow payments. Pay with USDC on Base — funds held in smart contract escrow with automatic release.",
      price_usdc: 5.00,
      escrow_duration_seconds: 30,
      agent_id: user.id,
    })
    .select("id, title")
    .single();

  if (productError || !product) throw new Error(`Product insert failed: ${productError?.message}`);
  console.log("[3/4] Product created:", product.title, `(${product.id})`);

  // 4. Register ERC-8004 agent on-chain (same as lib/erc8004.ts registerAgent)
  const agentURI = buildAgentURI(
    "Sobek Voice Agent",
    "Sobek marketplace voice agent — on-chain escrow payments with ERC-8004 reputation on Base"
  );
  console.log("[3/4] Registering agent on Base Sepolia...");
  console.log("  Arbiter:", arbiterAccount.address);

  const regHash = await walletClient.writeContract({
    address: ERC8004_IDENTITY_REGISTRY as `0x${string}`,
    abi: IDENTITY_ABI,
    functionName: "register",
    args: [agentURI],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: regHash });
  if (receipt.status === "reverted") throw new Error(`register() reverted: ${regHash}`);

  // Parse agentId from Transfer event
  let agentId: bigint | null = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== ERC8004_IDENTITY_REGISTRY.toLowerCase()) continue;
    if (log.topics.length >= 4 && log.topics[3]) {
      agentId = BigInt(log.topics[3]);
      break;
    }
  }
  if (agentId === null) throw new Error("No Transfer event found");
  console.log("  Agent ID:", agentId.toString());
  console.log("  Tx:", regHash);

  // 5. Store agentId in Supabase (same as ensureAgent)
  const { error: updateError } = await supabase
    .from("users")
    .update({ erc8004_agent_id: Number(agentId) })
    .eq("id", user.id);

  if (updateError) throw new Error(`User update failed: ${updateError.message}`);
  console.log("[4/4] Stored agent ID in database");

  // Verify tokenURI
  const uri = await publicClient.readContract({
    address: ERC8004_IDENTITY_REGISTRY as `0x${string}`,
    abi: IDENTITY_ABI,
    functionName: "tokenURI",
    args: [agentId],
  });
  const jsonStr = Buffer.from(uri.replace("data:application/json;base64,", ""), "base64").toString();
  const parsed = JSON.parse(jsonStr);

  console.log("\n════════════════════════════════════════");
  console.log("  Agent ID:  ", agentId.toString());
  console.log("  Name:      ", parsed.name);
  console.log("  Image:     ", parsed.image);
  console.log("  Owner:     ", arbiterAccount.address, "(soulbound to minter)");
  console.log("  Product:   ", product.title);
  console.log("  NFT:        https://sepolia.basescan.org/nft/" + ERC8004_IDENTITY_REGISTRY + "/" + agentId);
  console.log("════════════════════════════════════════");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
