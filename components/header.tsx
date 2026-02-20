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
        <div className="min-h-[40px] min-w-[148px] flex items-center justify-end">
          <ConnectButton showBalance={false} />
        </div>
        <SettingsLink />
      </div>
    </header>
  );
}
