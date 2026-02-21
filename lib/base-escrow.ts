import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseAbi,
  type Chain,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

const ESCROW_ABI = parseAbi([
  "function releaseToReceiver(uint256 registration) public payable",
]);

const adiTestnet = defineChain({
  id: 99999,
  name: "ADI Testnet",
  nativeCurrency: { name: "ADI", symbol: "ADI", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.ab.testnet.adifoundation.ai/"] },
  },
});

const ESCROW_CONFIG: Record<number, { address: `0x${string}`; chain: Chain }> = {
  [base.id]: {
    address: process.env.BASE_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    chain: base,
  },
  [baseSepolia.id]: {
    address: process.env.BASE_SEPOLIA_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    chain: baseSepolia,
  },
  [adiTestnet.id]: {
    address: process.env.ADI_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    chain: adiTestnet,
  },
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
  const config = ESCROW_CONFIG[chainId];
  if (!config?.address) {
    throw new Error(`No escrow contract configured for chain ${chainId}`);
  }

  const privateKey = process.env.ESCROW_ARBITER_PRIVATE_KEY;
  if (!privateKey) throw new Error("Missing ESCROW_ARBITER_PRIVATE_KEY");

  const transport = http();
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: config.chain,
    transport,
  });

  const publicClient = createPublicClient({
    chain: config.chain,
    transport,
  });

  const hash = await walletClient.writeContract({
    address: config.address,
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

/** @deprecated Use releaseEscrow instead */
export const releaseEscrowOnBase = (reg: number) => releaseEscrow(reg, base.id);
