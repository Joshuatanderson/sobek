"use client";

import { Header } from "@/components/header";
import { SettingsForm } from "./settings-form";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export default function SettingsPage() {
  const { isAuthenticated, userProfile, loading } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0a0f0a] text-white font-sans">
      <Header />

      <div className="w-full max-w-lg mt-8 space-y-8 px-4 sm:px-8 pb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sobek-green-light/80 hover:text-sobek-green-light transition-colors"
            aria-label="Back to home"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-sobek-gold">Settings</h1>
        </div>

        {loading ? (
          <div className="rounded-lg border border-sobek-forest/30 bg-sobek-forest/50 p-6">
            <p className="text-sobek-green-light/80">Loading...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="rounded-lg border border-sobek-forest/30 bg-sobek-forest/50 p-6">
            <p className="text-sobek-green-light/80">
              Connect your wallet to access settings.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-sobek-forest/30 bg-sobek-forest/50 p-6">
            <SettingsForm />
          </div>
        )}
      </div>
    </div>
  );
}
