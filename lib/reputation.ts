import { SupabaseClient } from "@supabase/supabase-js";

// --- Types ---

export type SLATier = "Sovereign" | "Institutional" | "Commercial" | "Restricted";

export interface MrateResult {
  tier: SLATier;
  mrate: number;
}

export interface ReputationInput {
  maxDeal: number;
  avgDeal: number;
  mrate: number;
  orderCount: number;
}

// --- Pure math (no DB) ---

/** Throws RangeError on NaN, Infinity, <=0, or non-number */
export function validateAmount(n: unknown): asserts n is number {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) {
    throw new RangeError(
      `amount must be a finite positive number, got ${String(n)}`
    );
  }
}

/** Power-law delta: round(amount^0.3 * multiplier) */
export const powerLaw =
  (multiplier: number) =>
  (amount: number): number => {
    validateAmount(amount);
    return Math.round(Math.pow(amount, 0.3) * multiplier);
  };

/** +rep for seller on successful order release */
export const calculateSuccessSeller = powerLaw(3);

/** -rep for seller when buyer wins dispute */
export const calculateDisputeLossSeller = (amount: number): number =>
  -powerLaw(15)(amount);

/** -rep for buyer when seller wins dispute */
export const calculateDisputeLossBuyer = (amount: number): number =>
  -powerLaw(6)(amount);

/** Map success rate → SLA tier and Mrate multiplier */
export function getMrateFromSuccessRate(rate: number): MrateResult {
  if (rate >= 0.99) return { tier: "Sovereign", mrate: 1.1 };
  if (rate >= 0.95) return { tier: "Institutional", mrate: 1.0 };
  if (rate >= 0.90) return { tier: "Commercial", mrate: 0.7 };
  return { tier: "Restricted", mrate: 0.1 };
}

/**
 * Full Gemini aggregate reputation formula:
 * round(max^0.15 * avg^0.15 * Mrate * log10(1 + n) * 10)
 */
export function computeReputation({
  maxDeal,
  avgDeal,
  mrate,
  orderCount,
}: ReputationInput): number {
  if (orderCount === 0 || maxDeal <= 0 || avgDeal <= 0) return 0;
  return Math.round(
    Math.pow(maxDeal, 0.15) *
      Math.pow(avgDeal, 0.15) *
      mrate *
      Math.log10(1 + orderCount) *
      10
  );
}

// --- DB-aware (async) ---

/** Query orders to compute seller's Mrate from success rate */
export async function getSellerMrate(
  supabase: SupabaseClient,
  wallet: string
): Promise<MrateResult> {
  // Look up seller user ID from wallet
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", wallet)
    .single();

  if (!user) return { tier: "Sovereign", mrate: 1.1 };

  // Get all product IDs owned by this seller
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("agent_id", user.id);

  if (!products || products.length === 0) return { tier: "Sovereign", mrate: 1.1 };

  const productIds = products.map((p) => p.id);

  // Count released and refunded orders for these products
  const { data: orders } = await supabase
    .from("orders")
    .select("escrow_status")
    .in("product_id", productIds)
    .in("escrow_status", ["released", "refunded"]);

  if (!orders || orders.length === 0) return { tier: "Sovereign", mrate: 1.1 };

  const released = orders.filter((o) => o.escrow_status === "released").length;
  const rate = released / orders.length;

  return getMrateFromSuccessRate(rate);
}
