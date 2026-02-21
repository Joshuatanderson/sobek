import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, type Chain } from "wagmi/chains";
import { http, cookieStorage, createStorage } from "wagmi";

export const adiTestnet = {
  id: 99999,
  name: "ADI Testnet",
  nativeCurrency: { name: "ADI Diamond", symbol: "ADI", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.ab.testnet.adifoundation.ai/"] },
  },
} as const satisfies Chain;

export const wagmiConfig = getDefaultConfig({
  appName: "Sobek",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [base, adiTestnet],
  transports: {
    [base.id]: http(),
    [adiTestnet.id]: http(),
  },
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});
