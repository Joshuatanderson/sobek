import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Chain,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import { Attribution } from "ox/erc8021";
import { ESCROW_BY_CHAIN, BUILDER_CODE, adiTestnet } from "@/config/constants";

const DATA_SUFFIX = Attribution.toDataSuffix({ codes: [BUILDER_CODE] });

const ESCROW_ABI = parseAbi([
  "function releaseToReceiver(uint256 registration) public payable",
  "function refundDepositor(uint256 registration) public payable",
]);

/** Map chainId → viem Chain object (for walletClient/publicClient) */
const CHAIN_BY_ID: Record<number, Chain> = {
  [base.id]: base,
  [baseSepolia.id]: baseSepolia,
  [adiTestnet.id]: adiTestnet,
};

/**
 * Calls releaseToReceiver() on the escrow contract for the given chain.
 * Defaults to Base mainnet if no chainId is provided.
 * Requires ESCROW_ARBITER_PRIVATE_KEY env var (the arbiter wallet).
 */
export async function releaseEscrow(
  escrowRegistration: number,
  chainId: number = base.id
): Promise<Hash> {
  const address = ESCROW_BY_CHAIN[chainId];
  const chain = CHAIN_BY_ID[chainId];
  if (!address || !chain) {
    throw new Error(`No escrow contract configured for chain ${chainId}`);
  }

  const privateKey = process.env.ESCROW_ARBITER_PRIVATE_KEY;
  if (!privateKey) throw new Error("Missing ESCROW_ARBITER_PRIVATE_KEY");

  const transport = http();
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain,
    transport,
    dataSuffix: DATA_SUFFIX,
  });

  const publicClient = createPublicClient({
    chain,
    transport,
  });

  const hash = await walletClient.writeContract({
    address,
    abi: ESCROW_ABI,
    functionName: "releaseToReceiver",
    args: [BigInt(escrowRegistration)],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") {
    throw new Error(`Transaction reverted: ${hash}`);
  }

  return hash;
}

/**
 * Calls refundDepositor() on the escrow contract for the given chain.
 * Defaults to Base mainnet if no chainId is provided.
 * Requires ESCROW_ARBITER_PRIVATE_KEY env var (the arbiter wallet).
 */
export async function refundEscrow(
  escrowRegistration: number,
  chainId: number = base.id
): Promise<Hash> {
  const address = ESCROW_BY_CHAIN[chainId];
  const chain = CHAIN_BY_ID[chainId];
  if (!address || !chain) {
    throw new Error(`No escrow contract configured for chain ${chainId}`);
  }

  const privateKey = process.env.ESCROW_ARBITER_PRIVATE_KEY;
  if (!privateKey) throw new Error("Missing ESCROW_ARBITER_PRIVATE_KEY");

  const transport = http();
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain,
    transport,
    dataSuffix: DATA_SUFFIX,
  });

  const publicClient = createPublicClient({
    chain,
    transport,
  });

  const hash = await walletClient.writeContract({
    address,
    abi: ESCROW_ABI,
    functionName: "refundDepositor",
    args: [BigInt(escrowRegistration)],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") {
    throw new Error(`Transaction reverted: ${hash}`);
  }

  return hash;
}
