#!/usr/bin/env bash
# Basescan API query tool (Etherscan V2)
# Usage: bash .claude/skills/basescan/query.sh <action> <address> [network]
#   action:  contract-source | txlist | tokentx | balance | abi
#   network: sepolia (default) | mainnet

set -euo pipefail

ACTION="${1:-}"
ADDRESS="${2:-}"
NETWORK="${3:-sepolia}"

if [[ -z "$ACTION" || -z "$ADDRESS" ]]; then
  echo "Usage: bash .claude/skills/basescan/query.sh <action> <address> [network]"
  echo "  Actions: contract-source, txlist, tokentx, balance, abi"
  echo "  Networks: sepolia (default), mainnet"
  exit 1
fi

# Resolve API key: .env first, then hardhat vars
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

API_KEY=""

# Try .env
if [[ -f "$PROJECT_ROOT/.env" ]]; then
  API_KEY=$(grep '^BASESCAN_API_KEY=' "$PROJECT_ROOT/.env" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || true)
fi

# Fallback to hardhat vars
if [[ -z "$API_KEY" ]]; then
  VARS_FILE="$HOME/Library/Preferences/hardhat-nodejs/vars.json"
  if [[ -f "$VARS_FILE" ]]; then
    API_KEY=$(python3 -c "import json; print(json.load(open('$VARS_FILE'))['vars']['BASE_API_KEY']['value'])" 2>/dev/null || true)
  fi
fi

if [[ -z "$API_KEY" ]]; then
  echo "ERROR: No API key found. Set BASESCAN_API_KEY in .env or run: cd contracts && bunx hardhat vars set BASE_API_KEY"
  exit 1
fi

# Etherscan V2 uses a single endpoint with chainid
BASE_URL="https://api.etherscan.io/v2/api"

if [[ "$NETWORK" == "mainnet" ]]; then
  CHAIN_ID="8453"
else
  CHAIN_ID="84532"
fi

case "$ACTION" in
  contract-source)
    curl -s "${BASE_URL}?chainid=${CHAIN_ID}&module=contract&action=getsourcecode&address=${ADDRESS}&apikey=${API_KEY}" | python3 -m json.tool
    ;;
  txlist)
    curl -s "${BASE_URL}?chainid=${CHAIN_ID}&module=account&action=txlist&address=${ADDRESS}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${API_KEY}" | python3 -m json.tool
    ;;
  tokentx)
    curl -s "${BASE_URL}?chainid=${CHAIN_ID}&module=account&action=tokentx&address=${ADDRESS}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${API_KEY}" | python3 -m json.tool
    ;;
  balance)
    curl -s "${BASE_URL}?chainid=${CHAIN_ID}&module=account&action=balance&address=${ADDRESS}&tag=latest&apikey=${API_KEY}" | python3 -m json.tool
    ;;
  abi)
    curl -s "${BASE_URL}?chainid=${CHAIN_ID}&module=contract&action=getabi&address=${ADDRESS}&apikey=${API_KEY}" | python3 -m json.tool
    ;;
  *)
    echo "Unknown action: $ACTION"
    echo "Valid actions: contract-source, txlist, tokentx, balance, abi"
    exit 1
    ;;
esac
