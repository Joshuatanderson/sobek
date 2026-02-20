"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LinkTelegram } from "@/components/link-telegram";
import { SettingsLink } from "@/components/settings-link";
import { SobekLogo } from "@/components/sobek-logo";

export function Header() {
  return (
    <header className="w-full flex items-center justify-between px-4 py-4 sm:px-6">
      <SobekLogo />
      <div className="flex items-center gap-2 sm:gap-3">
        <LinkTelegram />
        <ConnectButton showBalance={false} />
        <SettingsLink />
      </div>
    </header>
  );
}
