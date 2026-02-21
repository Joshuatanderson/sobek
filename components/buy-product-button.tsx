"use client";

import { useAccount } from "wagmi";
import { parseUnits, parseAbi, decodeEventLog, erc20Abi } from "viem";
import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { wagmiConfig } from "@/config/wagmi";
import { USDC_BY_CHAIN, ESCROW_BY_CHAIN, PLATFORM_FEE_MULTIPLIER } from "@/config/constants";
import { createTransaction } from "@/app/product/actions";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const ESCROW_ABI = parseAbi([
  "function deposit(address receiver, address token, uint256 value, string details) payable",
  "event Deposit(address indexed depositor, address indexed receiver, address token, uint256 amount, uint256 indexed registration, string details)",
]);

export function BuyProductButton({
  productId,
  priceUsdc,
  recipientAddress,
  productTitle,
}: {
  productId: string;
  priceUsdc: number;
  recipientAddress: `0x${string}`;
  productTitle: string;
}) {
  const { isConnected, address, chainId } = useAccount();
  const usdcAddress = chainId ? USDC_BY_CHAIN[chainId] : undefined;
  const escrowAddress = chainId ? ESCROW_BY_CHAIN[chainId] : undefined;
  const [status, setStatus] = useState<"idle" | "approving" | "depositing" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleBuy() {
    if (!usdcAddress || !escrowAddress || !address || !chainId) return;
    setStatus("approving");
    setErrorMsg("");

    try {
      const totalWithFee = priceUsdc * PLATFORM_FEE_MULTIPLIER;
      const amount = parseUnits(totalWithFee.toFixed(6), 6);

      // Approve escrow contract to spend USDC
      const approveTx = await writeContract(wagmiConfig, {
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [escrowAddress, amount],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: approveTx });

      // Deposit into escrow
      setStatus("depositing");
      const depositTx = await writeContract(wagmiConfig, {
        address: escrowAddress,
        abi: ESCROW_ABI,
        functionName: "deposit",
        args: [recipientAddress, usdcAddress, amount, `Product: ${productTitle}`],
      });
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: depositTx });

      // Parse registration from Deposit event
      let registration: number | undefined;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: ESCROW_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "Deposit") {
            registration = Number(decoded.args.registration);
            break;
          }
        } catch {
          // Not our event
        }
      }

      // Create the transaction record
      setStatus("submitting");
      const result = await createTransaction(productId, depositTx, address, "USDC", registration, chainId);
      if (result.error) {
        setStatus("error");
        setErrorMsg(result.error.message);
      } else {
        setStatus("success");
      }
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
    }
  }

  if (!isConnected) {
    return <span className="text-sobek-green-light/60 text-sm">Connect wallet</span>;
  }

  if (!usdcAddress || !escrowAddress) {
    return null;
  }

  if (status === "success") {
    return <span className="text-sobek-gold text-sm font-medium">Paid</span>;
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-1">
        <Button size="sm" onClick={handleBuy}>Retry</Button>
        <span className="text-red-400 text-xs max-w-[120px] truncate" title={errorMsg}>
          {errorMsg}
        </span>
      </div>
    );
  }

  const isLoading = status === "approving" || status === "depositing" || status === "submitting";

  return (
    <Button size="sm" onClick={handleBuy} disabled={isLoading}>
      {status === "approving" && "Approving..."}
      {status === "depositing" && "Depositing..."}
      {status === "submitting" && "Creating transaction..."}
      {status === "idle" && `Buy $${priceUsdc.toFixed(2)}`}
    </Button>
  );
}
