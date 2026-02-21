import { NextResponse } from "next/server";
import { initiateDispute } from "@/app/product/actions";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { wallet_address } = body as Record<string, unknown>;

  if (!wallet_address || typeof wallet_address !== "string") {
    return NextResponse.json({ error: "wallet_address is required" }, { status: 400 });
  }

  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet_address)) {
    return NextResponse.json({ error: "wallet_address must be a valid Ethereum address" }, { status: 400 });
  }

  const result = await initiateDispute(id, wallet_address);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ status: "disputed" });
}
