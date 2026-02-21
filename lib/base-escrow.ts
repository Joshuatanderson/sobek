import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const ESCROW_ABI = parseAbi([
  "function releaseToReceiver(uint256 registration) public payable",
]);

// Deployed SobekEscrow address on Base (mainnet)
const ESCROW_CONTRACT_ADDRESS = "0x1Facf2a68a0121F9a0f7449bD0C8d9a639e6569D" as const;

/**
 * Calls releaseToReceiver() on the Base escrow contract.
 * Waits for transaction confirmation before returning.
 * Requires ESCROW_ARBITER_PRIVATE_KEY env var (the arbiter wallet).
 */
export async function releaseEscrowOnBase(
  escrowRegistration: number
): Promise<Hash> {
  const privateKey = process.env.ESCROW_ARBITER_PRIVATE_KEY;
  if (!privateKey) throw new Error("Missing ESCROW_ARBITER_PRIVATE_KEY");

  const transport = http();
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport,
  });

  const publicClient = createPublicClient({
    chain: base,
    transport,
  });

  const hash = await walletClient.writeContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: ESCROW_ABI,
    functionName: "releaseToReceiver",
    args: [BigInt(escrowRegistration)],
  });

  // Wait for confirmation — throws if tx reverts
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") {
    throw new Error(`Transaction reverted: ${hash}`);
  }

  return hash;
}
