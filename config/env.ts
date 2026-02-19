function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Server-only vars — import this file from server code only
export const env = {
  SUPABASE_URL: required("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),
  TELEGRAM_BOT_TOKEN: required("TELEGRAM_BOT_TOKEN"),
  TELEGRAM_WEBHOOK_SECRET: required("TELEGRAM_WEBHOOK_SECRET"),
  TELEGRAM_BOT_USERNAME: required("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME"),
  WALLETCONNECT_PROJECT_ID: required("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"),
} as const;
