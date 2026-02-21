/**
 * Smoke test: create a 10-second Hedera scheduled transaction,
 * poll the mirror node until executed_timestamp appears.
 *
 * Usage: npx tsx --env-file=.env scripts/test-hedera-timer.ts
 */
import {
  Client,
  AccountId,
  PrivateKey,
  ScheduleCreateTransaction,
  TransferTransaction,
  Hbar,
  Timestamp,
} from "@hashgraph/sdk";

const MIRROR_URL = "https://testnet.mirrornode.hedera.com";
const DURATION_SECONDS = 10;
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 60_000;

async function main() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyHex = process.env.HEDRA_HEX_ENCODED_PRIVATE_KEY;

  if (!accountId || !privateKeyHex) {
    throw new Error("Missing HEDERA_ACCOUNT_ID or HEDRA_HEX_ENCODED_PRIVATE_KEY in env");
  }

  const client = Client.forTestnet();
  const operatorId = AccountId.fromString(accountId);
  const operatorKey = PrivateKey.fromStringECDSA(privateKeyHex);
  client.setOperator(operatorId, operatorKey);

  // Step 1: Create schedule with 10-second expiration
  const releaseAt = new Date(Date.now() + DURATION_SECONDS * 1000);
  console.log(`Creating schedule (expires in ${DURATION_SECONDS}s at ${releaseAt.toISOString()})...`);

  const innerTx = new TransferTransaction()
    .addHbarTransfer(operatorId, Hbar.fromTinybars(-1))
    .addHbarTransfer(operatorId, Hbar.fromTinybars(1));

  const scheduleTx = new ScheduleCreateTransaction()
    .setScheduledTransaction(innerTx)
    .setWaitForExpiry(true)
    .setExpirationTime(Timestamp.fromDate(releaseAt))
    .setAdminKey(operatorKey)
    .setScheduleMemo(`sobek:timer-test:${Date.now()}`);

  const response = await scheduleTx.execute(client);
  const receipt = await response.getReceipt(client);
  const scheduleId = receipt.scheduleId;

  if (!scheduleId) throw new Error("No schedule ID in receipt");

  console.log(`Schedule created: ${scheduleId.toString()}`);
  console.log(`Waiting for executed_timestamp on mirror node...`);

  // Step 2: Poll mirror node
  const start = Date.now();
  while (Date.now() - start < MAX_POLL_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const res = await fetch(`${MIRROR_URL}/api/v1/schedules/${scheduleId.toString()}`);

    if (!res.ok) {
      console.log(`  [${elapsed}s] mirror returned ${res.status}, retrying...`);
      continue;
    }

    const data = await res.json();

    if (data.executed_timestamp) {
      console.log(`  [${elapsed}s] executed_timestamp: ${data.executed_timestamp}`);
      console.log(`\nSUCCESS: ${DURATION_SECONDS}s Hedera schedule fired and detected on mirror node.`);
      client.close();
      return;
    }

    console.log(`  [${elapsed}s] not yet executed, polling...`);
  }

  console.error(`\nFAILED: schedule did not execute within ${MAX_POLL_MS / 1000}s`);
  client.close();
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
