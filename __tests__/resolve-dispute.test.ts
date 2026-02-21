import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockSelectSingle = vi.fn();

vi.mock("@/utils/supabase/admin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "transactions") {
        return {
          select: () => ({
            eq: () => ({
              single: () => mockSelectSingle(table),
            }),
          }),
          update: (data: any) => {
            mockUpdate(table, data);
            return {
              eq: (...args: any[]) => ({
                eq: (...args2: any[]) => ({
                  select: () => ({
                    single: () =>
                      mockUpdate.mock.results.length
                        ? Promise.resolve({ data: { id: "tx-123" }, error: null })
                        : Promise.resolve({ data: null, error: { message: "not found" } }),
                  }),
                }),
                // For the final DB update (no optimistic lock)
                then: (resolve: any) => Promise.resolve({ error: null }).then(resolve),
              }),
            };
          },
        };
      }
      if (table === "products") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { agent_id: "seller-1", price_usdc: 100 },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    id: "user-1",
                    wallet_address: "0xSeller",
                    reputation_score: 50,
                  },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "reputation_events") {
        return {
          insert: (data: any) => {
            mockInsert(table, data);
            return Promise.resolve({ error: null });
          },
        };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      };
    },
  },
}));

vi.mock("@/lib/base-escrow", () => ({
  releaseEscrow: vi.fn().mockResolvedValue("0xReleaseTxHash"),
  refundEscrow: vi.fn().mockResolvedValue("0xRefundTxHash"),
}));

vi.mock("@/lib/reputation", () => ({
  calculateDisputeLossSeller: vi.fn().mockReturnValue(-60),
  calculateDisputeLossBuyer: vi.fn().mockReturnValue(-24),
  getSellerMrate: vi.fn().mockResolvedValue({ tier: "Sovereign", mrate: 1.1 }),
}));

vi.mock("@/lib/hedera-hcs", () => ({
  logTierTransition: vi.fn().mockResolvedValue(undefined),
}));

// Import AFTER mocks
import { POST } from "@/app/api/admin/resolve-dispute/route";

function makeRequest(body: any, secret?: string) {
  return new Request("http://localhost:3000/api/admin/resolve-dispute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/resolve-dispute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_SECRET = "test-secret";

    mockSelectSingle.mockResolvedValue({
      data: {
        id: "tx-123",
        escrow_status: "disputed",
        escrow_registration: 42,
        product_id: "prod-1",
        client_id: "buyer-1",
        chain_id: 84532,
      },
      error: null,
    });
  });

  it("rejects requests without auth", async () => {
    const res = await POST(makeRequest({ transactionId: "tx-123", resolution: "refund" }));
    expect(res.status).toBe(401);
  });

  it("rejects requests with wrong auth", async () => {
    const res = await POST(
      makeRequest({ transactionId: "tx-123", resolution: "refund" }, "wrong-secret")
    );
    expect(res.status).toBe(401);
  });

  it("rejects invalid body - missing resolution", async () => {
    const res = await POST(
      makeRequest({ transactionId: "tx-123" }, "test-secret")
    );
    expect(res.status).toBe(400);
  });

  it("rejects invalid body - bad resolution value", async () => {
    const res = await POST(
      makeRequest({ transactionId: "tx-123", resolution: "destroy" }, "test-secret")
    );
    expect(res.status).toBe(400);
  });

  it("calls refundEscrow on refund resolution", async () => {
    const { refundEscrow } = await import("@/lib/base-escrow");

    const res = await POST(
      makeRequest({ transactionId: "tx-123", resolution: "refund" }, "test-secret")
    );
    const json = await res.json();

    expect(refundEscrow).toHaveBeenCalledWith(42, 84532);
    expect(json.status).toBe("refunded");
    expect(json.txHash).toBe("0xRefundTxHash");
  });

  it("calls releaseEscrow on release resolution", async () => {
    const { releaseEscrow } = await import("@/lib/base-escrow");

    const res = await POST(
      makeRequest({ transactionId: "tx-123", resolution: "release" }, "test-secret")
    );
    const json = await res.json();

    expect(releaseEscrow).toHaveBeenCalledWith(42, 84532);
    expect(json.status).toBe("released");
    expect(json.txHash).toBe("0xReleaseTxHash");
  });

  it("inserts negative reputation event on refund", async () => {
    await POST(
      makeRequest({ transactionId: "tx-123", resolution: "refund" }, "test-secret")
    );

    expect(mockInsert).toHaveBeenCalledWith("reputation_events", expect.objectContaining({
      reason: "dispute_refund",
      delta: -60,
      transaction_id: "tx-123",
    }));
  });

});
