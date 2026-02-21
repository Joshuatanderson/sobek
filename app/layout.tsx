import type { Metadata } from "next";
import { Sora, DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { CustomCursor } from "@/components/custom-cursor";
import { ScaleBackground } from "@/components/scale-background";
import { headers } from "next/headers";

const sora = Sora({ variable: "--font-sora", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Sobek",
  description: "Voice-powered product marketplace on USDC",
  icons: {
    icon: "/sobek-small.png",
  },
  other: {
    "base:app_id": "6997762671aadbc09e095f5f",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookie = (await headers()).get("cookie");

  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${dmSans.variable} ${spaceMono.variable} antialiased`}
      >
        <ScaleBackground />
        <CustomCursor />
        <Providers cookie={cookie}>{children}</Providers>
      </body>
    </html>
  );
}
