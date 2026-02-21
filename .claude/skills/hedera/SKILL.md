# Hedera Skills

## Network
- Using Hedera **testnet** for scheduling. Switch to mainnet via `Client.forMainnet()` in `lib/hedera.ts` for production.
- Operator account: `HEDERA_ACCOUNT_ID` env var (currently `0.0.7975985`)
- Private key env var has a typo: `HEDRA_HEX_ENCODED_PRIVATE_KEY` (missing second E) — kept for consistency

## Useful Links
- HashScan testnet schedule viewer: `https://hashscan.io/testnet/schedule/{scheduleId}` (links must be on one line)
- Mirror node API: `https://testnet.mirrornode.hedera.com/api/v1/schedules/{scheduleId}` (links must be on one line)
- HashScan testnet account viewer: `https://hashscan.io/testnet/account/{accountId}` (links must be on one line)

## Schedule Service
- We use Hedera schedules purely as decentralized timers for escrow auto-release
- Inner tx is a 1-tinybar self-transfer (no-op) — we only care about the expiry event
- `waitForExpiry(true)` means the schedule fires at expiration, not when signatures are collected
- `adminKey` set to operator key so we can delete schedules for disputes
- The inner tx must be explicitly frozen and signed with the operator key before passing to ScheduleCreateTransaction
- Max schedule duration: 62 days (Hedera limit)

## Key Files
- `lib/hedera.ts` — client singleton, operator helpers, mirror URL
- `lib/hedera-schedule.ts` — createEscrowSchedule()
- `lib/hedera-dispute.ts` — cancelEscrowSchedule()
- `scripts/test-hedera-schedule.ts` — manual test script

## Testing
```bash
cd /Users/joshuaanderson/Desktop/code/sobek && bunx tsx scripts/test-hedera-schedule.ts
```
