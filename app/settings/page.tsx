import { Header } from "@/components/header";
import { getCurrentUser } from "./actions";
import { SettingsForm } from "./settings-form";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0a0f0a] text-white font-sans">
      <Header />

      <div className="w-full max-w-lg mt-8 space-y-8 px-4 sm:px-8 pb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-emerald-300/60 hover:text-emerald-300 transition-colors"
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
          <h1 className="text-3xl font-bold text-emerald-400">Settings</h1>
        </div>

        {!user ? (
          <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/50 p-6">
            <p className="text-emerald-300/60">
              Connect your wallet to access settings.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/50 p-6">
            <SettingsForm currentDisplayName={user.display_name} />
          </div>
        )}
      </div>
    </div>
  );
}
