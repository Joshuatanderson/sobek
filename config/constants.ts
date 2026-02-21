import { base, baseSepolia, type Chain } from "wagmi/chains";

/** ADI Testnet chain definition — single source of truth */
export const adiTestnet = {
  id: 99999,
  name: "ADI Testnet",
  nativeCurrency: { name: "ADI Diamond", symbol: "ADI", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.ab.testnet.adifoundation.ai/"] },
  },
} as const satisfies Chain;

/** Deployed SobekEscrow contract addresses per chain */
export const ESCROW_BY_CHAIN: Record<number, `0x${string}`> = {
  [base.id]: process.env.NEXT_PUBLIC_BASE_ESCROW_CONTRACT_ADDRESS as `0x${string}` ??
    "0x840078504D8925d7033bcC64aae5bfDD87Fc299B",
  [baseSepolia.id]: process.env.NEXT_PUBLIC_BASE_SEPOLIA_ESCROW_CONTRACT_ADDRESS as `0x${string}` ??
    "0x8F1D7b515d8cA3Ce894E2CCFC9ee74B3ff8cA584",
  [adiTestnet.id]: process.env.NEXT_PUBLIC_ADI_ESCROW_CONTRACT_ADDRESS as `0x${string}` ??
    "0x0233CdB1d6fCED7Dfdd30A0bE3476317a6E02A6e",
};

export const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

/** Chains that have a USDC contract deployed */
export const USDC_BY_CHAIN: Record<number, `0x${string}` | null> = {
  [base.id]: BASE_USDC_ADDRESS,
  // ADI testnet has no USDC
};

/** Buyer pays price × 1.05; the 5% covers the platform fee taken on escrow release */
export const PLATFORM_FEE_MULTIPLIER = 1.05;

// DEV NOTE: Hardcoded ETH/USD price — deliberate oversimplification.
// Replace with a price oracle (e.g. Chainlink) when accuracy matters.
export const ETH_USD_PRICE = 1950;
