function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Server-only vars — lazily evaluated so static page generation doesn't
// blow up when env vars are only available at runtime (e.g. Vercel builds).
export const env = new Proxy(
  {
    SUPABASE_URL: "NEXT_PUBLIC_SUPABASE_URL",
    SUPABASE_ANON_KEY: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
    SUPABASE_SERVICE_ROLE_KEY: "SUPABASE_SERVICE_ROLE_KEY",
WALLETCONNECT_PROJECT_ID: "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID",
    UNISWAP_API_KEY: "UNISWAP_API_KEY",
  } as const,
  {
    get(target, prop: string) {
      const envName = target[prop as keyof typeof target];
      if (!envName) throw new Error(`Unknown env key: ${prop}`);
      return required(envName);
    },
  }
) as unknown as {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
readonly WALLETCONNECT_PROJECT_ID: string;
  readonly UNISWAP_API_KEY: string;
};
