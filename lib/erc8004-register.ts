import {
  createPublicClient,
  createWalletClient,
  http,
  decodeEventLog,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { Attribution } from "ox/erc8021";
import {
  ERC8004_IDENTITY_REGISTRY,
  BUILDER_CODE,
} from "@/config/constants";
import { IDENTITY_ABI, buildAgentURI } from "@/lib/erc8004";

const DATA_SUFFIX = Attribution.toDataSuffix({ codes: [BUILDER_CODE] });

/**
 * Register a new ERC-8004 agent on Base Sepolia for the given wallet.
 * Called by the arbiter — the NFT is minted to the arbiter but the agentId
 * is stored on the seller's user record for reputation tracking.
 *
 * Returns the numeric agentId (tokenId).
 */
export async function registerAgent(sellerWallet: string): Promise<number> {
  const privateKey = process.env.ESCROW_ARBITER_PRIVATE_KEY;
  if (!privateKey) throw new Error("Missing ESCROW_ARBITER_PRIVATE_KEY");

  const transport = http();
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport,
    dataSuffix: DATA_SUFFIX,
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport,
  });

  const agentURI = buildAgentURI(sellerWallet);

  const hash = await walletClient.writeContract({
    address: ERC8004_IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: "register",
    args: [agentURI],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") {
    throw new Error(`register() reverted: ${hash}`);
  }

  // Extract tokenId from Transfer event
  const transferLog = receipt.logs.find(
    (log) => log.address.toLowerCase() === ERC8004_IDENTITY_REGISTRY.toLowerCase() && log.topics.length === 4
  );

  if (!transferLog) {
    throw new Error("No Transfer event found in register() receipt");
  }

  const decoded = decodeEventLog({
    abi: IDENTITY_ABI,
    data: transferLog.data,
    topics: transferLog.topics,
  });

  const tokenId = Number((decoded.args as { tokenId: bigint }).tokenId);
  return tokenId;
}
