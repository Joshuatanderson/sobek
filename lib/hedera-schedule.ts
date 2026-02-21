import {
  ScheduleCreateTransaction,
  TransferTransaction,
  Hbar,
  Timestamp,
} from "@hashgraph/sdk";
import { getHederaClient, getOperatorId, getOperatorKey } from "./hedera";

/**
 * Creates a Hedera scheduled transaction that acts as a decentralized timer.
 * The inner tx is a no-op 1-tinybar self-transfer; we only care about the
 * expiration firing so the cron can detect it and release escrow on Base.
 */
export async function createEscrowSchedule(
  orderId: string,
  durationHours: number
): Promise<{ scheduleId: string; releaseAt: Date }> {
  const client = getHederaClient();
  const operatorId = getOperatorId();
  const operatorKey = getOperatorKey();

  const releaseAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
  const expirationTime = Timestamp.fromDate(releaseAt);

  // Inner tx: 1-tinybar self-transfer (pure timer, no real transfer).
  // Frozen and explicitly signed with operator key so the schedule has
  // all required signatures at creation time and will execute at expiry.
  const innerTx = new TransferTransaction()
    .addHbarTransfer(operatorId, Hbar.fromTinybars(-1))
    .addHbarTransfer(operatorId, Hbar.fromTinybars(1))
    .freezeWith(client);

  const signedInnerTx = await innerTx.sign(operatorKey);

  const scheduleTx = new ScheduleCreateTransaction()
    .setScheduledTransaction(signedInnerTx)
    .setWaitForExpiry(true)
    .setExpirationTime(expirationTime)
    .setAdminKey(operatorKey)
    .setScheduleMemo(`sobek:order:${orderId}`);

  const response = await scheduleTx.execute(client);
  const receipt = await response.getReceipt(client);

  const scheduleId = receipt.scheduleId;
  if (!scheduleId) throw new Error("Failed to get schedule ID from receipt");

  return {
    scheduleId: scheduleId.toString(),
    releaseAt,
  };
}
