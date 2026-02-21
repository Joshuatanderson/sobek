# Sobek

A voice-powered onchain agent marketplace. Talk to an AI agent to buy services, swap tokens, and make escrow-backed payments — no account required.

## What it does

Sobek connects buyers and sellers through a voice interface. Buyers speak to an ElevenLabs-powered voice agent that can browse available services, execute payments into an onchain escrow contract, and swap tokens via Uniswap. Sellers list services and receive payment automatically when the escrow period expires, or through arbiter-mediated dispute resolution.

Every transaction builds a decentralized reputation score — logged to Hedera Consensus Service for tamper-proof auditability and published onchain via ERC-8004.

### Core flow

1. Buyer connects a wallet and talks to the voice agent
2. Agent presents available services and handles payment (USDC or native ETH)
3. Funds are locked in the SobekEscrow smart contract
4. After the escrow period, funds auto-release to the seller (minus 5% platform fee)
5. Either party can dispute — an arbiter resolves and reputation is adjusted accordingly

## Key features

- **Voice-first UX** — ElevenLabs conversational agent handles product discovery, payment, and navigation
- **Onchain escrow** — SobekEscrow contract on Base handles deposits, timed releases, and dispute resolution for both USDC and ETH
- **No account required** — buyers just connect a wallet via RainbowKit/Coinbase
- **Decentralized reputation** — power-law scoring with SLA tiers (Sovereign, Institutional, Commercial, Restricted), stored in Supabase, logged to Hedera, and published onchain via ERC-8004
- **Token swaps** — Uniswap integration for ETH/USDC/WETH swaps directly through the voice agent
- **Dispute resolution** — arbiter-driven refund or release with automatic reputation penalties
- **Telegram notifications** — buyers and sellers get notified on escrow releases and dispute outcomes
- **Multi-chain** — deployed on Base, Base Sepolia, and ADI Testnet

## Tech stack

| Layer | Tech |
|-------|------|
| Framework | Next.js, React |
| Voice | ElevenLabs Conversational AI |
| Blockchain | Viem, Wagmi, RainbowKit |
| Contracts | Solidity (Hardhat), deployed on Base and ADI testnet|
| Database | Supabase (PostgreSQL) |
| Consensus | Hedera Consensus Service |
| Reputation | ERC-8004 (Base Sepolia) |
| Swaps | Uniswap API |

## Architecture

```
app/                  → Next.js pages and API routes
  api/cron/           → Scheduled escrow release via Hedera mirror polling
  api/admin/          → Arbiter dispute resolution endpoint
  api/swap/           → Uniswap quote, approval check, and execution
contracts/            → SobekEscrow Solidity contract and Hardhat config
config/constants.ts   → Single source of truth for all chain/contract/fee constants
lib/                  → Core logic (escrow, reputation, ERC-8004, Hedera HCS)
hooks/                → useSobekVoice — voice agent integration with client-side tools
components/           → UI components (wallet, payments, disputes, product forms)
```

## Contracts

**SobekEscrow** — a multilateral escrow supporting ETH and ERC-20 tokens. Depositors lock funds specifying a receiver. After the escrow period, an arbiter or cron job releases funds to the receiver (minus platform fee) or refunds the depositor in case of a dispute.

| Network | Address |
|---------|---------|
| Base | `0x99196930e14F890f03F9CcA7c6c4277D3A7bb152` |
| Base Sepolia | `0x34bA72BBfc9C8617E1F0dA8eb77c137aB4304b8f` |
| ADI Testnet | `0xF52564E82Db53511A200545ac8773c97bc43a4fe` |

## License

Proprietary.
