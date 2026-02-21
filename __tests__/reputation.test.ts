import { describe, it, expect } from "vitest";
import {
  calculateSuccessSeller,
  calculateDisputeLossSeller,
  calculateDisputeLossBuyer,
} from "@/lib/reputation";

describe("reputation calculations", () => {
  describe("calculateSuccessSeller (log10 × 10)", () => {
    it.each([
      [10, 10],
      [100, 20],
      [1000, 30],
      [50, 17],
      [1, 0],
      [0.5, -3],
    ])("amount $%d → +%d", (amount, expected) => {
      expect(calculateSuccessSeller(amount)).toBe(expected);
    });
  });

  describe("calculateDisputeLossSeller (-(log10 × 50))", () => {
    it.each([
      [10, -50],
      [100, -100],
      [1000, -150],
      [50, -85],
      [1, 0],
      [0.5, 15],
    ])("amount $%d → %d", (amount, expected) => {
      expect(calculateDisputeLossSeller(amount)).toBe(expected);
    });
  });

  describe("calculateDisputeLossBuyer (-(log10 × 20))", () => {
    it.each([
      [10, -20],
      [100, -40],
      [1000, -60],
      [50, -34],
      [1, 0],
      [0.5, 6],
    ])("amount $%d → %d", (amount, expected) => {
      expect(calculateDisputeLossBuyer(amount)).toBe(expected);
    });
  });

  describe("edge cases", () => {
    it("throws on amountUsd = 0", () => {
      expect(() => calculateSuccessSeller(0)).toThrow(RangeError);
      expect(() => calculateDisputeLossSeller(0)).toThrow(RangeError);
      expect(() => calculateDisputeLossBuyer(0)).toThrow(RangeError);
    });

    it("throws on negative amountUsd", () => {
      expect(() => calculateSuccessSeller(-5)).toThrow(RangeError);
    });

    it("handles very large amounts (1_000_000)", () => {
      expect(calculateSuccessSeller(1_000_000)).toBe(60);
      expect(calculateDisputeLossSeller(1_000_000)).toBe(-300);
      expect(calculateDisputeLossBuyer(1_000_000)).toBe(-120);
    });
  });
});
