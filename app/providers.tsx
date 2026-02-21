"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, cookieToInitialState } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { wagmiConfig } from "@/config/wagmi";

export function Providers({
  children,
  cookie,
}: {
  children: React.ReactNode;
  cookie: string | null;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const initialState = cookieToInitialState(wagmiConfig, cookie);

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={undefined}
          theme={{
            ...darkTheme({
              accentColor: "#4ea02e",
              accentColorForeground: "white",
              borderRadius: "large",
            }),
            colors: {
              ...darkTheme().colors,
              accentColor: "#4ea02e",
              accentColorForeground: "white",
              connectButtonBackground: "#0a0f0a",
              connectButtonInnerBackground: "#142016",
              connectButtonText: "#a1c193",
              generalBorder: "#315a57",
              generalBorderDim: "rgba(49, 90, 87, 0.5)",
              modalBackground: "#0a0f0a",
              modalBorder: "#315a57",
              modalText: "#cddfc5",
              modalTextDim: "rgba(161, 193, 147, 0.6)",
              modalTextSecondary: "#a1c193",
              menuItemBackground: "#142016",
              profileAction: "#142016",
              profileActionHover: "#1a2e20",
              profileForeground: "#0e1610",
              closeButton: "#a1c193",
              closeButtonBackground: "#142016",
              actionButtonBorder: "#315a57",
              actionButtonSecondaryBackground: "#142016",
              selectedOptionBorder: "#4ea02e",
            },
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
