import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";
import { http, cookieStorage, createStorage } from "wagmi";
import { adiTestnet } from "./constants";

export const wagmiConfig = getDefaultConfig({
  appName: "Sobek",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [base, baseSepolia, adiTestnet],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [adiTestnet.id]: http(),
  },
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});
