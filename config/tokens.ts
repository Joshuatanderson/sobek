import { base } from "wagmi/chains";
import { adiTestnet, BASE_USDC_ADDRESS } from "./constants";

export interface Token {
  symbol: string;
  address: string;
  decimals: number;
}

const BASE_TOKENS: Record<string, Token> = {
  ETH: {
    symbol: "ETH",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
  },
  USDC: {
    symbol: "USDC",
    address: BASE_USDC_ADDRESS,
    decimals: 6,
  },
  WETH: {
    symbol: "WETH",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
  },
} as const;

const ADI_TOKENS: Record<string, Token> = {
  ADI: {
    symbol: "ADI",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
  },
} as const;

export const TOKENS_BY_CHAIN: Record<number, Record<string, Token>> = {
  [base.id]: BASE_TOKENS,
  [adiTestnet.id]: ADI_TOKENS,
};

/** Backwards-compat default (Base tokens) */
export const SUPPORTED_TOKENS = BASE_TOKENS;
