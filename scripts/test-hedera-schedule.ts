import "dotenv/config";
import { createEscrowSchedule } from "../lib/hedera-schedule";
import { HEDERA_MIRROR_URL } from "../lib/hedera";

async function main() {
  console.log("Creating a 5-minute Hedera schedule...");

  const { scheduleId, releaseAt } = await createEscrowSchedule(
    "test-transaction-001",
    5 / 60 // 5 minutes in hours
  );

  console.log("Schedule created!");
  console.log("  Schedule ID:", scheduleId);
  console.log("  Release at:", releaseAt.toISOString());

  // Poll mirror node to verify it exists
  console.log("\nPolling mirror node...");
  const url = `${HEDERA_MIRROR_URL}/api/v1/schedules/${scheduleId}`;
  console.log("  URL:", url);

  // Mirror node can take a few seconds to index
  await new Promise((r) => setTimeout(r, 5000));

  const res = await fetch(url);
  if (!res.ok) {
    console.error("Mirror node returned", res.status, await res.text());
    return;
  }

  const data = await res.json();
  console.log("  Memo:", data.memo);
  console.log("  Executed:", data.executed_timestamp ?? "not yet");
  console.log("  Expiration:", data.expiration_time);
  console.log("\nDone. Schedule is live on Hedera testnet.");
}

main().catch(console.error);
