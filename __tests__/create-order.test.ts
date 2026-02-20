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

/** Sets up the 3 mockFrom calls: task lookup, user upsert, order insert */
function mockHappyPath(orderData: { data: unknown; error: unknown }) {
  mockFrom
    .mockReturnValueOnce(mockSelectQuery({ data: TASK, error: null }))
    .mockReturnValueOnce(mockUpsertQuery({ data: CLIENT, error: null }))
    .mockReturnValueOnce(mockInsertQuery(orderData));
}

beforeEach(() => {
  vi.clearAllMocks();
});

const TASK = {
  id: "task-1",
  title: "Logo Design",
  price_usdc: 50,
  agent_id: "provider-1",
};

describe("createOrder", () => {
  it("creates an order and notifies provider", async () => {
    mockHappyPath({ data: { id: "order-1", status: "paid" }, error: null });
    mockNotifyUser.mockResolvedValue(true);

    const result = await createOrder("task-1", "0xabc123", "0xWALLET");

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ id: "order-1", status: "paid" });
    expect(mockNotifyUser).toHaveBeenCalledWith(
      "provider-1",
      expect.stringContaining("Logo Design")
    );
  });

  it("returns error when task not found", async () => {
    mockFrom.mockReturnValueOnce(
      mockSelectQuery({ data: null, error: { message: "not found" } })
    );

    const result = await createOrder("bad-id", "0xabc", "0xWALLET");

    expect(result.error?.message).toBe("Task not found");
    expect(result.data).toBeNull();
    // Should never try to upsert user or insert order
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("skips notification when task has no agent_id", async () => {
    const taskNoAgent = { ...TASK, agent_id: null };
    mockFrom
      .mockReturnValueOnce(mockSelectQuery({ data: taskNoAgent, error: null }))
      .mockReturnValueOnce(mockUpsertQuery({ data: CLIENT, error: null }))
      .mockReturnValueOnce(
        mockInsertQuery({ data: { id: "order-2", status: "paid" }, error: null })
      );

    const result = await createOrder("task-1", "0xdef", "0xWALLET");

    expect(result.error).toBeNull();
    expect(mockNotifyUser).not.toHaveBeenCalled();
  });

  it("returns error when order insert fails", async () => {
    mockHappyPath({ data: null, error: { message: "duplicate key" } });

    const result = await createOrder("task-1", "0xabc123", "0xWALLET");

    expect(result.error?.message).toBe("duplicate key");
    expect(mockNotifyUser).not.toHaveBeenCalled();
  });

  it("includes client_id and task_id in the order insert", async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: { id: "order-4", status: "paid", client_id: CLIENT.id, task_id: "task-1" },
            error: null,
          }),
      }),
    });

    mockFrom
      .mockReturnValueOnce(mockSelectQuery({ data: TASK, error: null }))
      .mockReturnValueOnce(mockUpsertQuery({ data: CLIENT, error: null }))
      .mockReturnValueOnce({ insert: insertMock });

    mockNotifyUser.mockResolvedValue(true);

    await createOrder("task-1", "0xabc123", "0xWALLET");

    const insertPayload = insertMock.mock.calls[0][0];
    expect(insertPayload).toHaveProperty("task_id", "task-1");
    expect(insertPayload).toHaveProperty("client_id", CLIENT.id);
  });

  it("includes currency in notification", async () => {
    mockHappyPath({ data: { id: "order-3", status: "paid" }, error: null });
    mockNotifyUser.mockResolvedValue(true);

    await createOrder("task-1", "0xabc", "0xWALLET", "ETH");

    expect(mockNotifyUser).toHaveBeenCalledWith(
      "provider-1",
      expect.stringContaining("ETH")
    );
  });
});
