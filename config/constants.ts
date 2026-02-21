import { base } from "wagmi/chains";

export const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

/** Chains that have a USDC contract deployed */
export const USDC_BY_CHAIN: Record<number, `0x${string}` | null> = {
  [base.id]: BASE_USDC_ADDRESS,
  // ADI testnet has no USDC
};

// DEV NOTE: Hardcoded ETH/USD price — deliberate oversimplification.
// Replace with a price oracle (e.g. Chainlink) when accuracy matters.
export const ETH_USD_PRICE = 1950;
