import { ScheduleDeleteTransaction, ScheduleId } from "@hashgraph/sdk";
import { getHederaClient } from "./hedera";

/**
 * Cancels a Hedera scheduled transaction to prevent auto-release.
 * Requires the schedule to have been created with an admin key.
 */
export async function cancelEscrowSchedule(scheduleId: string): Promise<void> {
  const client = getHederaClient();

  const deleteTx = new ScheduleDeleteTransaction()
    .setScheduleId(ScheduleId.fromString(scheduleId));

  const response = await deleteTx.execute(client);
  await response.getReceipt(client);
}
