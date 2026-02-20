import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFrom = vi.fn();
const mockSendTelegramMessage = vi.fn();

vi.mock("@/utils/supabase/admin", () => ({
  supabaseAdmin: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock("@/utils/telegram", () => ({
  sendTelegramMessage: (...args: unknown[]) =>
    mockSendTelegramMessage(...args),
}));

vi.mock("@/config/env", () => ({
  env: {
    TELEGRAM_WEBHOOK_SECRET: "test-secret",
  },
}));

import { POST } from "@/app/api/telegram/webhook/route";

function makeRequest(body: object, secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret) headers["x-telegram-bot-api-secret-token"] = secret;

  return new NextRequest("http://localhost/api/telegram/webhook", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function mockUserLookup(user: { id: string; wallet_address: string } | null) {
  return {
    select: () => ({
      eq: () => ({
        single: () =>
          Promise.resolve({
            data: user,
            error: user ? null : { message: "not found" },
          }),
      }),
    }),
  };
}

function mockUserUpdate(error: { message: string } | null = null) {
  return {
    update: () => ({
      eq: () => Promise.resolve({ error }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("telegram webhook", () => {
  const VALID_BODY = {
    message: {
      text: "/start abc123token",
      chat: { id: 99999 },
      from: { username: "josh" },
    },
  };

  it("rejects requests with wrong secret", async () => {
    const res = await POST(makeRequest(VALID_BODY, "wrong-secret"));
    const json = await res.json();

    expect(json.ok).toBe(true); // returns 200 ok (Telegram convention)
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("ignores non-/start messages", async () => {
    const body = {
      message: { text: "hello", chat: { id: 1 }, from: { username: "x" } },
    };
    const res = await POST(makeRequest(body, "test-secret"));
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("links user when token matches", async () => {
    const user = { id: "user-1", wallet_address: "0xabcdef1234567890" };
    mockFrom
      .mockReturnValueOnce(mockUserLookup(user))
      .mockReturnValueOnce(mockUserUpdate());

    const res = await POST(makeRequest(VALID_BODY, "test-secret"));
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(mockSendTelegramMessage).toHaveBeenCalledWith(
      99999,
      expect.stringContaining("0xabcd")
    );
  });

  it("sends error when token not found", async () => {
    mockFrom.mockReturnValueOnce(mockUserLookup(null));

    await POST(makeRequest(VALID_BODY, "test-secret"));

    expect(mockSendTelegramMessage).toHaveBeenCalledWith(
      99999,
      "Link token not found or expired."
    );
  });

  it("handles missing username gracefully", async () => {
    const body = {
      message: {
        text: "/start abc123token",
        chat: { id: 99999 },
        from: {}, // no username field
      },
    };
    const user = { id: "user-1", wallet_address: "0xabcdef1234567890" };
    mockFrom
      .mockReturnValueOnce(mockUserLookup(user))
      .mockReturnValueOnce(mockUserUpdate());

    const res = await POST(makeRequest(body, "test-secret"));
    const json = await res.json();

    expect(json.ok).toBe(true);
    // Should still succeed, just with null handle
  });
});
