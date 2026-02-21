import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

let _client: Client | null = null;

export function getHederaClient(): Client {
  if (_client) return _client;

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyHex = process.env.HEDRA_HEX_ENCODED_PRIVATE_KEY;

  if (!accountId || !privateKeyHex) {
    throw new Error("Missing HEDERA_ACCOUNT_ID or HEDRA_HEX_ENCODED_PRIVATE_KEY");
  }

  _client = Client.forTestnet();
  _client.setOperator(
    AccountId.fromString(accountId),
    PrivateKey.fromStringECDSA(privateKeyHex)
  );

  return _client;
}

export function getOperatorId(): AccountId {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  if (!accountId) throw new Error("Missing HEDERA_ACCOUNT_ID");
  return AccountId.fromString(accountId);
}

export function getOperatorKey(): PrivateKey {
  const privateKeyHex = process.env.HEDRA_HEX_ENCODED_PRIVATE_KEY;
  if (!privateKeyHex) throw new Error("Missing HEDRA_HEX_ENCODED_PRIVATE_KEY");
  return PrivateKey.fromStringECDSA(privateKeyHex);
}

export const HEDERA_MIRROR_URL = "https://testnet.mirrornode.hedera.com";
