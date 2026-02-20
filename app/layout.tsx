import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { CustomCursor } from "@/components/custom-cursor";
import { ClickEffect } from "@/components/click-effect";
import { ScaleBackground } from "@/components/scale-background";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sobek",
  description: "Voice-powered task marketplace on USDC",
  icons: {
    icon: "/icon.svg",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ScaleBackground />
        <CustomCursor />
        <ClickEffect />
        <Providers cookie={cookie}>{children}</Providers>
      </body>
    </html>
  );
}
