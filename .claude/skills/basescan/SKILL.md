# Basescan Skill

Query the Basescan API (Etherscan V2) to inspect contracts and transactions on Base.

## Prerequisites

- `BASE_API_KEY` set via `bunx hardhat vars set BASE_API_KEY` (stored in hardhat vars.json)

## Commands

All commands run from project root.

### Check if a contract is verified

```bash
bash .claude/skills/basescan/query.sh contract-source <address> [network]
```

### Get recent transactions for an address

```bash
bash .claude/skills/basescan/query.sh txlist <address> [network]
```

### Get ERC-20 token transfers for an address

```bash
bash .claude/skills/basescan/query.sh tokentx <address> [network]
```

### Get ETH balance

```bash
bash .claude/skills/basescan/query.sh balance <address> [network]
```

### Get contract ABI (must be verified)

```bash
bash .claude/skills/basescan/query.sh abi <address> [network]
```

## Networks

| Name | Value |
|------|-------|
| Base Sepolia (default) | `sepolia` |
| Base Mainnet | `mainnet` |

## Known Addresses

| What | Address | Network |
|------|---------|---------|
| SobekEscrow | `0xC1883Aac539c95A14F46f170A833E5B1ad0c4E9F` | sepolia |
| Arbiter | `0xcdd46667E9Ce3db1Bd978DF806479BBE615E0523` | sepolia |
