"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LinkTelegram } from "@/components/link-telegram";
import { SettingsLink } from "@/components/settings-link";
import { SobekLogo } from "@/components/sobek-logo";

export function Header() {
  return (
    <header className="w-full flex items-center justify-between px-4 py-4 sm:px-6">
      <SobekLogo />
      <div className="flex items-center gap-2 sm:gap-3">
        <nav className="flex items-center gap-4 mr-2">
          <Link href="/product" className="text-sm text-sobek-green-light/80 hover:text-sobek-gold transition-colors">
            Products
          </Link>
          <Link href="/transactions" className="text-sm text-sobek-green-light/80 hover:text-sobek-gold transition-colors">
            Transactions
          </Link>
        </nav>
        <LinkTelegram />
        <div className="min-h-[40px] min-w-[148px] flex items-center justify-end">
          <ConnectButton showBalance={false} />
        </div>
        <SettingsLink />
      </div>
    </header>
  );
}
