# Deploy Contract Skill

Deploy and verify SobekEscrow on Base networks using Hardhat.

## Prerequisites

Set these via `bunx hardhat vars set <KEY>` from `contracts/`:
- `PRIVATE_KEY` — deployer wallet private key
- `BASE_API_KEY` — Basescan API key (for verification)

Deployer wallet needs ETH on the target network for gas.

## Commands

All commands run from `contracts/` directory.

### Compile
```bash
cd contracts && bunx hardhat compile
```

### Deploy to Base Sepolia (testnet)
```bash
cd contracts && bunx hardhat run --network baseSepolia scripts/deploy.ts
```

### Deploy to Base Mainnet
```bash
cd contracts && bunx hardhat run --network baseMain scripts/deploy.ts
```

### Verify an existing contract
```bash
cd contracts && bunx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> "0xcdd46667E9Ce3db1Bd978DF806479BBE615E0523"
```

Replace `baseSepolia` with `baseMain` for mainnet verification.

## Deployed Addresses

| Network | Address |
|---------|---------|
| Base Sepolia | `0xC1883Aac539c95A14F46f170A833E5B1ad0c4E9F` |
| Base Mainnet | *not yet deployed* |

## Notes

- Arbiter address is hardcoded in `contracts/scripts/deploy.ts`: `0xcdd46667E9Ce3db1Bd978DF806479BBE615E0523`
- Deploy script auto-verifies after a 30s delay
- Contract size: ~3.8 KiB (well under 24 KiB limit)
- Using Hardhat v2 (not v3 — v3 broke the `vars` API)
