import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { getHederaClient } from "./hedera";
import type { SLATier } from "./reputation";

export interface TierTransitionMessage {
  wallet: string;
  previousTier: SLATier;
  newTier: SLATier;
  reputationScore: number;
  transactionId: string;
  timestamp: string;
}

export interface ReputationEventMessage {
  type: "reputation_event";
  wallet: string;
  delta: number;
  reason: string;
  amount_usd: number;
  transaction_id: string;
  timestamp: string;
}

/**
 * Log a reputation event to Hedera Consensus Service.
 * Returns the topic sequence number for storage in the DB.
 * Throws on failure — callers decide how to handle.
 */
export async function logReputationEvent(
  msg: Omit<ReputationEventMessage, "type">
): Promise<number> {
  const topicId = process.env.HEDERA_REPUTATION_TOPIC_ID;
  if (!topicId) {
    throw new Error("HEDERA_REPUTATION_TOPIC_ID not set");
  }

  const client = getHederaClient();
  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(JSON.stringify({ type: "reputation_event", ...msg }));

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);

  return Number(receipt.topicSequenceNumber);
}

/**
 * Log a reputation tier transition to Hedera Consensus Service.
 * Throws on failure — callers decide how to handle.
 */
export async function logTierTransition(
  msg: TierTransitionMessage
): Promise<void> {
  const topicId = process.env.HEDERA_REPUTATION_TOPIC_ID;
  if (!topicId) {
    throw new Error("HEDERA_REPUTATION_TOPIC_ID not set");
  }

  const client = getHederaClient();
  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(JSON.stringify(msg));

  await tx.execute(client);
}
