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

import { createOrder } from "@/app/task/actions";

// Helpers to build Supabase chain mocks
function mockQuery(result: { data: unknown; error: unknown }) {
  return {
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve(result),
      }),
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve(result),
      }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createOrder", () => {
  const TASK = {
    id: "task-1",
    title: "Logo Design",
    price_usdc: 50,
    agent_id: "provider-1",
  };

  it("creates an order and notifies provider", async () => {
    // First call: task lookup. Second call: order insert.
    mockFrom
      .mockReturnValueOnce(mockQuery({ data: TASK, error: null }))
      .mockReturnValueOnce(
        mockQuery({ data: { id: "order-1", status: "paid" }, error: null })
      );
    mockNotifyUser.mockResolvedValue(true);

    const result = await createOrder("task-1", "0xabc123");

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ id: "order-1", status: "paid" });
    expect(mockNotifyUser).toHaveBeenCalledWith(
      "provider-1",
      expect.stringContaining("Logo Design")
    );
  });

  it("returns error when task not found", async () => {
    mockFrom.mockReturnValueOnce(
      mockQuery({ data: null, error: { message: "not found" } })
    );

    const result = await createOrder("bad-id", "0xabc");

    expect(result.error?.message).toBe("Task not found");
    expect(result.data).toBeNull();
    // Should never try to insert an order
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("skips notification when task has no agent_id", async () => {
    const taskNoAgent = { ...TASK, agent_id: null };
    mockFrom
      .mockReturnValueOnce(mockQuery({ data: taskNoAgent, error: null }))
      .mockReturnValueOnce(
        mockQuery({ data: { id: "order-2", status: "paid" }, error: null })
      );

    const result = await createOrder("task-1", "0xdef");

    expect(result.error).toBeNull();
    expect(mockNotifyUser).not.toHaveBeenCalled();
  });

  it("returns error when order insert fails", async () => {
    mockFrom
      .mockReturnValueOnce(mockQuery({ data: TASK, error: null }))
      .mockReturnValueOnce(
        mockQuery({ data: null, error: { message: "duplicate key" } })
      );

    const result = await createOrder("task-1", "0xabc123");

    expect(result.error?.message).toBe("duplicate key");
    // Should NOT notify on failed order
    expect(mockNotifyUser).not.toHaveBeenCalled();
  });

  it("includes currency in notification", async () => {
    mockFrom
      .mockReturnValueOnce(mockQuery({ data: TASK, error: null }))
      .mockReturnValueOnce(
        mockQuery({ data: { id: "order-3", status: "paid" }, error: null })
      );
    mockNotifyUser.mockResolvedValue(true);

    await createOrder("task-1", "0xabc", "ETH");

    expect(mockNotifyUser).toHaveBeenCalledWith(
      "provider-1",
      expect.stringContaining("ETH")
    );
  });
});
