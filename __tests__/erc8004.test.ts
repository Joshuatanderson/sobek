import { describe, it, expect } from "vitest";
import { buildAgentURI } from "@/lib/erc8004";

describe("buildAgentURI", () => {
  it("returns a valid base64 data URI", () => {
    const uri = buildAgentURI("0x1234567890abcdef1234567890abcdef12345678");

    expect(uri).toMatch(/^data:application\/json;base64,/);

    const base64 = uri.replace("data:application/json;base64,", "");
    const parsed = JSON.parse(atob(base64));

    expect(parsed.name).toBe("Sobek 0x1234...5678");
    expect(parsed.description).toContain("0x1234567890abcdef1234567890abcdef12345678");
    expect(parsed.active).toBe(true);
    expect(parsed.supportedTrust).toEqual(["reputation"]);
  });
});
