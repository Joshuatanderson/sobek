import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the module
const mockFrom = vi.fn();
const mockNotifyUser = vi.fn();

vi.mock("@/utils/supabase/admin", () => ({
  supabaseAdmin: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock("@/utils/telegram", () => ({
  notifyUser: (...args: unknown[]) => mockNotifyUser(...args),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createTransaction } from "@/app/product/actions";

// Helpers to build Supabase chain mocks
function mockSelectQuery(result: { data: unknown; error: unknown }) {
  return {
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve(result),
      }),
    }),
  };
}

function mockUpsertQuery(result: { data: unknown; error: unknown }) {
  return {
    upsert: () => ({
      select: () => ({
        single: () => Promise.resolve(result),
      }),
    }),
  };
}

function mockInsertQuery(result: { data: unknown; error: unknown }) {
  return {
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve(result),
      }),
    }),
  };
}

const CLIENT = { id: "client-uuid-1" };

/** Sets up the 3 mockFrom calls: product lookup, user upsert, transaction insert */
function mockHappyPath(transactionData: { data: unknown; error: unknown }) {
  mockFrom
    .mockReturnValueOnce(mockSelectQuery({ data: PRODUCT, error: null }))
    .mockReturnValueOnce(mockUpsertQuery({ data: CLIENT, error: null }))
    .mockReturnValueOnce(mockInsertQuery(transactionData));
}

beforeEach(() => {
  vi.clearAllMocks();
});

const PRODUCT = {
  id: "product-1",
  title: "Logo Design",
  price_usdc: 50,
  agent_id: "provider-1",
};

describe("createTransaction", () => {
  it("creates a transaction and notifies provider", async () => {
    mockHappyPath({ data: { id: "tx-1", status: "paid" }, error: null });
    mockNotifyUser.mockResolvedValue(true);

    const result = await createTransaction("product-1", "0xabc123", "0xWALLET");

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ id: "tx-1", status: "paid" });
    expect(mockNotifyUser).toHaveBeenCalledWith(
      "provider-1",
      expect.stringContaining("Logo Design")
    );
  });

  it("returns error when product not found", async () => {
    mockFrom.mockReturnValueOnce(
      mockSelectQuery({ data: null, error: { message: "not found" } })
    );

    const result = await createTransaction("bad-id", "0xabc", "0xWALLET");

    expect(result.error?.message).toBe("Product not found");
    expect(result.data).toBeNull();
    // Should never try to upsert user or insert transaction
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("skips notification when product has no agent_id", async () => {
    const productNoAgent = { ...PRODUCT, agent_id: null };
    mockFrom
      .mockReturnValueOnce(mockSelectQuery({ data: productNoAgent, error: null }))
      .mockReturnValueOnce(mockUpsertQuery({ data: CLIENT, error: null }))
      .mockReturnValueOnce(
        mockInsertQuery({ data: { id: "tx-2", status: "paid" }, error: null })
      );

    const result = await createTransaction("product-1", "0xdef", "0xWALLET");

    expect(result.error).toBeNull();
    expect(mockNotifyUser).not.toHaveBeenCalled();
  });

  it("returns error when transaction insert fails", async () => {
    mockHappyPath({ data: null, error: { message: "duplicate key" } });

    const result = await createTransaction("product-1", "0xabc123", "0xWALLET");

    expect(result.error?.message).toBe("duplicate key");
    expect(mockNotifyUser).not.toHaveBeenCalled();
  });

  it("includes client_id and product_id in the transaction insert", async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: { id: "tx-4", status: "paid", client_id: CLIENT.id, product_id: "product-1" },
            error: null,
          }),
      }),
    });

    mockFrom
      .mockReturnValueOnce(mockSelectQuery({ data: PRODUCT, error: null }))
      .mockReturnValueOnce(mockUpsertQuery({ data: CLIENT, error: null }))
      .mockReturnValueOnce({ insert: insertMock });

    mockNotifyUser.mockResolvedValue(true);

    await createTransaction("product-1", "0xabc123", "0xWALLET");

    const insertPayload = insertMock.mock.calls[0][0];
    expect(insertPayload).toHaveProperty("product_id", "product-1");
    expect(insertPayload).toHaveProperty("client_id", CLIENT.id);
  });

  it("includes currency in notification", async () => {
    mockHappyPath({ data: { id: "tx-3", status: "paid" }, error: null });
    mockNotifyUser.mockResolvedValue(true);

    await createTransaction("product-1", "0xabc", "0xWALLET", "ETH");

    expect(mockNotifyUser).toHaveBeenCalledWith(
      "provider-1",
      expect.stringContaining("ETH")
    );
  });
});
