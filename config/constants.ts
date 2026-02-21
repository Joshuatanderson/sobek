import { base, baseSepolia, type Chain } from "wagmi/chains";

/** ADI Testnet chain definition — single source of truth */
export const adiTestnet = {
  id: 99999,
  name: "ADI Testnet",
  nativeCurrency: { name: "ADI Diamond", symbol: "ADI", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.ab.testnet.adifoundation.ai/"] },
  },
  iconUrl: "/adi-diamond.png",
} as const satisfies Chain;

/** Deployed SobekEscrow contract addresses per chain (public, not secrets) */
export const ESCROW_BY_CHAIN: Record<number, `0x${string}`> = {
  [base.id]: "0x99196930e14F890f03F9CcA7c6c4277D3A7bb152",
  [baseSepolia.id]: "0x34bA72BBfc9C8617E1F0dA8eb77c137aB4304b8f",
  [adiTestnet.id]: "0xF52564E82Db53511A200545ac8773c97bc43a4fe",
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

/** Arbiter / admin wallet — owns the escrow contracts */
export const ARBITER_ADDRESS = "0xcdd46667E9Ce3db1Bd978DF806479BBE615E0523" as const;

/** ERC-8021 Builder Code — registered at base.dev */
export const BUILDER_CODE = "bc_5xrhurof" as const;

/** ERC-8004 on-chain reputation (Base Sepolia) */
export const ERC8004_IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const;
export const ERC8004_REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713" as const;
