/**
 * One-time setup: create a Hedera Consensus Service topic for reputation tier logging.
 * Run with: bunx tsx scripts/create-hcs-topic.ts
 * Then paste the output topic ID into .env.local as HEDERA_REPUTATION_TOPIC_ID.
 */
import "dotenv/config";
import { TopicCreateTransaction } from "@hashgraph/sdk";
import { getHederaClient, getOperatorKey } from "../lib/hedera";

async function main() {
  const client = getHederaClient();
  const operatorKey = getOperatorKey();

  const tx = new TopicCreateTransaction()
    .setAdminKey(operatorKey)
    .setSubmitKey(operatorKey)
    .setTopicMemo("sobek:reputation-tiers");

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);
  const topicId = receipt.topicId;

  if (!topicId) {
    console.error("Failed to get topic ID from receipt");
    process.exit(1);
  }

  console.log(`HCS topic created: ${topicId.toString()}`);
  console.log(`\nAdd to .env.local:\nHEDERA_REPUTATION_TOPIC_ID=${topicId.toString()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
