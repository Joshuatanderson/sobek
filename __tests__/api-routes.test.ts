import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---
const mockFrom = vi.fn();

vi.mock("@/utils/supabase/admin", () => ({
  supabaseAdmin: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/hedera-schedule", () => ({
  createEscrowSchedule: vi.fn().mockResolvedValue({
    scheduleId: "0.0.123",
    releaseAt: new Date("2026-01-01T00:00:10Z"),
  }),
}));

vi.mock("@/lib/hedera-dispute", () => ({
  cancelEscrowSchedule: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/erc8004-register", () => ({
  registerAgent: vi.fn().mockResolvedValue(42),
}));

// --- Imports (after mocks) ---
import { GET as getProducts, POST as postProduct } from "@/app/api/products/route";
import { POST as postOrder } from "@/app/api/orders/route";
import { GET as getOrder } from "@/app/api/orders/[id]/route";
import { POST as postDispute } from "@/app/api/orders/[id]/dispute/route";

beforeEach(() => vi.clearAllMocks());

// --- Helpers ---
function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue(Promise.resolve(result)),
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
        limit: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(result),
        }),
        not: vi.fn().mockResolvedValue(result),
      }),
      not: vi.fn().mockResolvedValue(result),
      limit: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
      }),
    }),
    upsert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(result),
        }),
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(result),
          }),
        }),
      }),
    }),
  };
}

// ======================
// GET /api/products
// ======================
describe("GET /api/products", () => {
  it("returns products array", async () => {
    const products = [{ id: "p1", title: "Test", price_usdc: 10 }];
    const chain = mockChain({ data: products, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await getProducts();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(products);
  });

  it("returns 500 on DB error", async () => {
    const chain = mockChain({ data: null, error: { message: "db down" } });
    mockFrom.mockReturnValue(chain);

    const res = await getProducts();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("db down");
  });
});

// ======================
// POST /api/products
// ======================
describe("POST /api/products", () => {
  it("rejects missing title", async () => {
    const res = await postProduct(jsonRequest({}));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/title/);
  });

  it("rejects missing wallet_address", async () => {
    const res = await postProduct(
      jsonRequest({ title: "Test", description: "Desc", price_usdc: 1 })
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/wallet_address/);
  });

  it("rejects negative price", async () => {
    const res = await postProduct(
      jsonRequest({
        title: "Test", description: "Desc", price_usdc: -1,
        wallet_address: "0x" + "a".repeat(40),
      })
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/positive/);
  });

  it("rejects invalid escrow_duration_seconds", async () => {
    const res = await postProduct(
      jsonRequest({
        title: "Test", description: "Desc", price_usdc: 1,
        wallet_address: "0x" + "a".repeat(40), escrow_duration_seconds: 0,
      })
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/escrow_duration/);
  });

  it("creates product on valid input", async () => {
    const user = { id: "user-1", erc8004_agent_id: 42 };
    const product = { id: "prod-1", title: "Test" };
    // Two calls: upsert user, then insert product
    mockFrom
      .mockReturnValueOnce(mockChain({ data: user, error: null }))
      .mockReturnValueOnce(mockChain({ data: product, error: null }));

    const res = await postProduct(
      jsonRequest({
        title: "Test", description: "Desc", price_usdc: 5,
        wallet_address: "0x" + "a".repeat(40),
      })
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.product).toEqual(product);
  });

  it("auto-registers ERC-8004 agent for new seller", async () => {
    const user = { id: "user-1", erc8004_agent_id: null };
    const product = { id: "prod-1", title: "Test" };
    // Three calls: upsert user, update erc8004_agent_id, insert product
    mockFrom
      .mockReturnValueOnce(mockChain({ data: user, error: null }))
      .mockReturnValueOnce(mockChain({ data: null, error: null }))
      .mockReturnValueOnce(mockChain({ data: product, error: null }));

    const res = await postProduct(
      jsonRequest({
        title: "Test", description: "Desc", price_usdc: 5,
        wallet_address: "0x" + "a".repeat(40),
      })
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.product).toEqual(product);
  });
});

// ======================
// POST /api/orders
// ======================
describe("POST /api/orders", () => {
  it("rejects missing product_id", async () => {
    const res = await postOrder(jsonRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/product_id/);
  });

  it("rejects missing tx_hash", async () => {
    const res = await postOrder(jsonRequest({ product_id: "abc" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/tx_hash/);
  });

  it("rejects missing wallet_address", async () => {
    const res = await postOrder(
      jsonRequest({ product_id: "abc", tx_hash: "0x" + "a".repeat(64) })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/wallet_address/);
  });

  it("rejects missing escrow_registration", async () => {
    const res = await postOrder(
      jsonRequest({
        product_id: "abc",
        tx_hash: "0x" + "a".repeat(64),
        wallet_address: "0x" + "b".repeat(40),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/escrow_registration/);
  });

  it("rejects invalid wallet_address format", async () => {
    const res = await postOrder(
      jsonRequest({
        product_id: "abc",
        tx_hash: "0x" + "a".repeat(64),
        wallet_address: "not-an-address",
        escrow_registration: 1,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/valid Ethereum address/);
  });

  it("rejects invalid tx_hash format", async () => {
    const res = await postOrder(
      jsonRequest({
        product_id: "abc",
        tx_hash: "0xshort",
        wallet_address: "0x" + "b".repeat(40),
        escrow_registration: 1,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/valid transaction hash/);
  });

  it("rejects duplicate tx_hash with 409", async () => {
    // First call: duplicate check finds existing
    mockFrom.mockReturnValue(
      mockChain({ data: { id: "existing" }, error: null })
    );

    const res = await postOrder(
      jsonRequest({
        product_id: "abc",
        tx_hash: "0x" + "a".repeat(64),
        wallet_address: "0x" + "b".repeat(40),
        escrow_registration: 1,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/already recorded/);
  });

  it("rejects invalid JSON", async () => {
    const req = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await postOrder(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid JSON");
  });
});

// ======================
// GET /api/orders/[id]
// ======================
describe("GET /api/orders/[id]", () => {
  it("returns order data", async () => {
    const order = { id: "tx-1", escrow_status: "released" };
    mockFrom.mockReturnValue(mockChain({ data: order, error: null }));

    const res = await getOrder(
      new Request("http://localhost/api/orders/tx-1"),
      { params: Promise.resolve({ id: "tx-1" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("tx-1");
  });

  it("returns 404 for missing order", async () => {
    mockFrom.mockReturnValue(
      mockChain({ data: null, error: { message: "not found", code: "PGRST116" } })
    );

    const res = await getOrder(
      new Request("http://localhost/api/orders/missing"),
      { params: Promise.resolve({ id: "missing" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Transaction not found");
  });
});

// ======================
// POST /api/orders/[id]/dispute
// ======================
describe("POST /api/orders/[id]/dispute", () => {
  it("rejects missing wallet_address", async () => {
    const req = new Request("http://localhost/api/orders/tx-1/dispute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await postDispute(req, {
      params: Promise.resolve({ id: "tx-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/wallet_address/);
  });

  it("rejects invalid wallet format", async () => {
    const req = new Request("http://localhost/api/orders/tx-1/dispute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: "bad" }),
    });

    const res = await postDispute(req, {
      params: Promise.resolve({ id: "tx-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/valid Ethereum address/);
  });

  it("returns error when transaction not found", async () => {
    mockFrom.mockReturnValue(
      mockChain({ data: null, error: { message: "not found" } })
    );

    const req = new Request("http://localhost/api/orders/tx-1/dispute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: "0x" + "a".repeat(40) }),
    });

    const res = await postDispute(req, {
      params: Promise.resolve({ id: "tx-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/not found/i);
  });
});
