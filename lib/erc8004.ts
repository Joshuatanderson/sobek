import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import {
  ERC8004_IDENTITY_REGISTRY,
  ERC8004_REPUTATION_REGISTRY,
} from "@/config/constants";
import type { SupabaseClient } from "@supabase/supabase-js";

const IDENTITY_ABI = parseAbi([
  "function register(string agentURI) external returns (uint256)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);

const REPUTATION_ABI = parseAbi([
  "function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash) external",
  "function getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2) external view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)",
]);

function getClients() {
  const privateKey = process.env.ESCROW_ARBITER_PRIVATE_KEY;
  if (!privateKey) throw new Error("Missing ESCROW_ARBITER_PRIVATE_KEY");

  const transport = http();
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport,
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport,
  });

  return { account, walletClient, publicClient };
}

/** Build an ERC-8004 compliant data: URI with inline JSON metadata. */
function buildAgentURI(sellerWallet: string): string {
  const truncated = `${sellerWallet.slice(0, 6)}...${sellerWallet.slice(-4)}`;
  const metadata = JSON.stringify({
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: `Sobek ${truncated}`,
    description: `Sobek marketplace seller ${sellerWallet}`,
    image: "https://www.callsobek.xyz/sobek-small.png",
    active: true,
    services: [],
    registrations: [],
    supportedTrust: ["reputation"],
  });
  return "data:application/json;base64," + Buffer.from(metadata).toString("base64");
}

/**
 * Register an agent on the ERC-8004 Identity Registry.
 * Mints the agent NFT, then transfers it to the seller wallet so the
 * arbiter can later call giveFeedback without "Self-feedback not allowed".
 * Returns the minted tokenId (agentId).
 */
export async function registerAgent(
  sellerWallet: `0x${string}`
): Promise<bigint> {
  const { account, walletClient, publicClient } = getClients();

  const agentURI = buildAgentURI(sellerWallet);

  const hash: Hash = await walletClient.writeContract({
    address: ERC8004_IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: "register",
    args: [agentURI],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") {
    throw new Error(`register() reverted: ${hash}`);
  }

  // Parse Transfer event to extract tokenId
  let agentId: bigint | null = null;
  for (const log of receipt.logs) {
    try {
      if (log.address.toLowerCase() !== ERC8004_IDENTITY_REGISTRY.toLowerCase()) continue;
      if (log.topics.length >= 4 && log.topics[3]) {
        agentId = BigInt(log.topics[3]);
        break;
      }
    } catch {
      continue;
    }
  }

  if (agentId === null) {
    throw new Error(`No Transfer event found in register() tx: ${hash}`);
  }

  // Transfer NFT to seller so arbiter can give feedback (avoids self-feedback)
  const transferHash = await walletClient.writeContract({
    address: ERC8004_IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: "transferFrom",
    args: [account.address, sellerWallet, agentId],
  });

  const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferHash });
  if (transferReceipt.status === "reverted") {
    throw new Error(`transferFrom() reverted: ${transferHash}`);
  }

  return agentId;
}

/**
 * Post feedback for an agent on the ERC-8004 Reputation Registry.
 * tag1 is always "sobek", tag2 is the feedback category (e.g. "escrow-release").
 */
export async function giveFeedback(
  agentId: bigint,
  value: number,
  tag2: string = "escrow-release"
): Promise<Hash> {
  const { walletClient, publicClient } = getClients();

  const hash: Hash = await walletClient.writeContract({
    address: ERC8004_REPUTATION_REGISTRY,
    abi: REPUTATION_ABI,
    functionName: "giveFeedback",
    args: [
      agentId,
      BigInt(value) as unknown as bigint, // int128
      0, // valueDecimals
      "sobek", // tag1
      tag2, // tag2
      "", // endpoint (unused)
      "", // feedbackURI (unused)
      "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // feedbackHash (unused)
    ],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") {
    throw new Error(`giveFeedback() reverted: ${hash}`);
  }

  return hash;
}

/**
 * Ensure a user has an ERC-8004 agent NFT. Fire-and-forget — checks DB first,
 * registers on-chain if needed, stores the result. Never throws.
 */
export async function ensureAgent(
  supabase: SupabaseClient,
  userId: string,
  wallet: `0x${string}`
): Promise<void> {
  try {
    const { data } = await supabase
      .from("users")
      .select("erc8004_agent_id")
      .eq("id", userId)
      .single();

    if (data?.erc8004_agent_id != null) return;

    const agentId = await registerAgent(wallet);
    await supabase
      .from("users")
      .update({ erc8004_agent_id: Number(agentId) })
      .eq("id", userId);
  } catch (err) {
    console.error("ensureAgent failed (non-fatal):", err);
  }
}

/**
 * Read on-chain reputation summary for an agent.
 * Passes the arbiter address as the only clientAddress for filtering.
 */
export async function getReputationSummary(
  agentId: bigint,
  tag2: string = ""
): Promise<{ count: bigint; summaryValue: bigint; summaryValueDecimals: number }> {
  const { account, publicClient } = getClients();

  const [count, summaryValue, summaryValueDecimals] = await publicClient.readContract({
    address: ERC8004_REPUTATION_REGISTRY,
    abi: REPUTATION_ABI,
    functionName: "getSummary",
    args: [agentId, [account.address], "sobek", tag2],
  });

  return { count, summaryValue, summaryValueDecimals };
}
