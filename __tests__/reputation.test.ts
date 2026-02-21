import { describe, it, expect, vi } from "vitest";
import {
  validateAmount,
  calculateSuccessSeller,
  calculateDisputeLossSeller,
  calculateDisputeLossBuyer,
  getMrateFromSuccessRate,
  computeReputation,
  getSellerMrate,
} from "@/lib/reputation";

describe("reputation calculations", () => {
  // --- Power-law per-event deltas ---

  describe("calculateSuccessSeller (amount^0.3 × 3)", () => {
    it.each([
      [10, 6],
      [100, 12],
      [1_000, 24],
      [100_000, 95],
      [0.5, 2],
    ])("amount $%d → +%d", (amount, expected) => {
      expect(calculateSuccessSeller(amount)).toBe(expected);
    });
  });

  describe("calculateDisputeLossSeller (-(amount^0.3 × 15))", () => {
    it.each([
      [10, -30],
      [100, -60],
      [1_000, -119],
      [100_000, -474],
      [0.5, -12],
    ])("amount $%d → %d", (amount, expected) => {
      expect(calculateDisputeLossSeller(amount)).toBe(expected);
    });
  });

  describe("calculateDisputeLossBuyer (-(amount^0.3 × 6))", () => {
    it.each([
      [10, -12],
      [100, -24],
      [1_000, -48],
      [100_000, -190],
      [0.5, -5],
    ])("amount $%d → %d", (amount, expected) => {
      expect(calculateDisputeLossBuyer(amount)).toBe(expected);
    });
  });

  // --- Input validation ---

  describe("validateAmount", () => {
    it("throws on NaN", () => {
      expect(() => validateAmount(NaN)).toThrow(RangeError);
    });

    it("throws on Infinity", () => {
      expect(() => validateAmount(Infinity)).toThrow(RangeError);
    });

    it("throws on 0", () => {
      expect(() => validateAmount(0)).toThrow(RangeError);
    });

    it("throws on negative", () => {
      expect(() => validateAmount(-5)).toThrow(RangeError);
    });

    it("throws on non-number", () => {
      expect(() => validateAmount("10")).toThrow(RangeError);
    });
  });

  // --- Mrate tiers ---

  describe("getMrateFromSuccessRate", () => {
    it.each([
      [1.0, "Sovereign", 1.1],
      [0.99, "Sovereign", 1.1],
      [0.98, "Institutional", 1.0],
      [0.95, "Institutional", 1.0],
      [0.94, "Commercial", 0.7],
      [0.90, "Commercial", 0.7],
      [0.89, "Restricted", 0.1],
      [0.5, "Restricted", 0.1],
    ])("rate %f → %s (mrate %f)", (rate, expectedTier, expectedMrate) => {
      const result = getMrateFromSuccessRate(rate);
      expect(result.tier).toBe(expectedTier);
      expect(result.mrate).toBe(expectedMrate);
    });
  });

  // --- Full Gemini formula ---

  describe("computeReputation", () => {
    it("growing seller: 10 × $100, Sovereign", () => {
      expect(
        computeReputation({
          maxDeal: 100,
          avgDeal: 100,
          mrate: 1.1,
          transactionCount: 10,
        })
      ).toBe(46);
    });

    it("zero transactions → 0", () => {
      expect(
        computeReputation({
          maxDeal: 0,
          avgDeal: 0,
          mrate: 1.0,
          transactionCount: 0,
        })
      ).toBe(0);
    });

    it("veteran seller: max $100k, avg $1k, 50 transactions, Institutional", () => {
      expect(
        computeReputation({
          maxDeal: 100_000,
          avgDeal: 1_000,
          mrate: 1.0,
          transactionCount: 50,
        })
      ).toBe(271);
    });

    it("new seller: 1 × $50, Sovereign", () => {
      expect(
        computeReputation({
          maxDeal: 50,
          avgDeal: 50,
          mrate: 1.1,
          transactionCount: 1,
        })
      ).toBe(11);
    });

    it("scammer: 10 transactions, Restricted (80% rate)", () => {
      expect(
        computeReputation({
          maxDeal: 100,
          avgDeal: 100,
          mrate: 0.1,
          transactionCount: 10,
        })
      ).toBe(4);
    });
  });

  // --- getSellerMrate with mocked Supabase ---

  describe("getSellerMrate", () => {
    function mockSupabase(userRow: any, productRows: any[], transactionRows: any[]) {
      const chainable = (result: { data: any; error: null }) => {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          in: () => chain,
          single: () => Promise.resolve(result),
          then: (resolve: any) => Promise.resolve(result).then(resolve),
        };
        // Make it thenable for non-.single() calls
        chain[Symbol.for("nodejs.util.inspect.custom")] = undefined;
        return chain;
      };

      let callCount = 0;
      return {
        from: (table: string) => {
          if (table === "users") return chainable({ data: userRow, error: null });
          if (table === "products") {
            return {
              select: () => ({
                eq: () => Promise.resolve({ data: productRows, error: null }),
              }),
            };
          }
          if (table === "transactions") {
            return {
              select: () => ({
                in: () => ({
                  in: () => Promise.resolve({ data: transactionRows, error: null }),
                }),
              }),
            };
          }
          return chainable({ data: null, error: null });
        },
      } as any;
    }

    it("returns Sovereign for unknown wallet", async () => {
      const sb = mockSupabase(null, [], []);
      const result = await getSellerMrate(sb, "0xunknown");
      expect(result).toEqual({ tier: "Sovereign", mrate: 1.1 });
    });

    it("returns Sovereign for seller with no resolved transactions", async () => {
      const sb = mockSupabase({ id: "u1" }, [{ id: "p1" }], []);
      const result = await getSellerMrate(sb, "0xseller");
      expect(result).toEqual({ tier: "Sovereign", mrate: 1.1 });
    });

    it("returns Restricted for seller with <90% success", async () => {
      const transactions = [
        ...Array(8).fill({ escrow_status: "released" }),
        ...Array(3).fill({ escrow_status: "refunded" }),
      ];
      const sb = mockSupabase({ id: "u1" }, [{ id: "p1" }], transactions);
      const result = await getSellerMrate(sb, "0xseller");
      // 8/11 = 72.7% → Restricted
      expect(result.tier).toBe("Restricted");
      expect(result.mrate).toBe(0.1);
    });

    it("returns Institutional for 95-98% success", async () => {
      const transactions = [
        ...Array(96).fill({ escrow_status: "released" }),
        ...Array(4).fill({ escrow_status: "refunded" }),
      ];
      const sb = mockSupabase({ id: "u1" }, [{ id: "p1" }], transactions);
      const result = await getSellerMrate(sb, "0xseller");
      // 96/100 = 96% → Institutional
      expect(result.tier).toBe("Institutional");
      expect(result.mrate).toBe(1.0);
    });
  });
});
