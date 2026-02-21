import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockGetUser = vi.fn();
const mockAdminUpdate = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: () => mockGetUser() },
      from: () => ({
        insert: (data: unknown) => mockInsert(data),
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { wallet_address: "0xabc" }, error: null }) }) }),
      }),
    }),
}));

vi.mock("@/utils/supabase/admin", () => ({
  supabaseAdmin: {
    from: () => ({
      update: (data: unknown) => {
        mockAdminUpdate(data);
        return { eq: () => Promise.resolve({ error: null }) };
      },
    }),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createProduct, storeAgentId } from "@/app/product/actions";

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  mockInsert.mockReturnValue({
    select: () => Promise.resolve({ data: [{ id: "product-1" }], error: null }),
  });
  mockAdminUpdate.mockClear();
});

describe("createProduct", () => {
  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await createProduct(
      null,
      formData({ title: "X", description: "Y", price_usdc: "10" })
    );

    expect(result.error?.message).toBe("Not authenticated");
  });

  it("rejects missing title", async () => {
    const result = await createProduct(
      null,
      formData({ title: "", description: "Y", price_usdc: "10" })
    );
    expect(result.error?.message).toBe("Missing required fields");
  });

  it("rejects non-numeric price", async () => {
    const result = await createProduct(
      null,
      formData({ title: "X", description: "Y", price_usdc: "abc" })
    );
    expect(result.error?.message).toBe("Missing required fields");
  });

  it("accepts valid input", async () => {
    const result = await createProduct(
      null,
      formData({ title: "Logo", description: "Make a logo", price_usdc: "25" })
    );

    expect(result.error).toBeNull();
    expect(mockInsert).toHaveBeenCalledWith({
      title: "Logo",
      description: "Make a logo",
      price_usdc: 25,
      escrow_duration_seconds: null,
      agent_id: "user-1",
    });
  });

  it("rejects negative price", async () => {
    const result = await createProduct(
      null,
      formData({ title: "X", description: "Y", price_usdc: "-50" })
    );
    expect(result.error?.message).toBe("Price must be greater than zero");
  });

  it("rejects zero price", async () => {
    const result = await createProduct(
      null,
      formData({ title: "X", description: "Y", price_usdc: "0" })
    );
    expect(result.error?.message).toBe("Price must be greater than zero");
  });
});

describe("storeAgentId", () => {
  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await storeAgentId(42);
    expect(result.error?.message).toBe("Not authenticated");
    expect(mockAdminUpdate).not.toHaveBeenCalled();
  });

  it("stores agent ID for authenticated user", async () => {
    const result = await storeAgentId(42);

    expect(result.error).toBeNull();
    expect(mockAdminUpdate).toHaveBeenCalledWith({ erc8004_agent_id: 42 });
  });
});
