"use client";

import { useAccount, useChains } from "wagmi";
import { parseEther, parseAbi, decodeEventLog, zeroAddress } from "viem";
import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { wagmiConfig } from "@/config/wagmi";
import { ESCROW_BY_CHAIN, ETH_USD_PRICE, PLATFORM_FEE_MULTIPLIER } from "@/config/constants";
import { createTransaction } from "@/app/product/actions";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const ESCROW_ABI = parseAbi([
  "function deposit(address receiver, address token, uint256 value, string details) payable",
  "event Deposit(address indexed depositor, address indexed receiver, address token, uint256 amount, uint256 indexed registration, string details)",
]);

export function BuyNativeButton({
  productId,
  price,
  recipientAddress,
  productTitle,
}: {
  productId: string;
  price: number;
  recipientAddress: `0x${string}`;
  productTitle: string;
}) {
  const { isConnected, address, chainId } = useAccount();
  const chains = useChains();
  const nativeCurrency = chains[0].nativeCurrency;
  const escrowAddress = chainId ? ESCROW_BY_CHAIN[chainId] : undefined;
  const [status, setStatus] = useState<"idle" | "depositing" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleBuy() {
    if (!escrowAddress || !address || !chainId) return;
    setStatus("depositing");
    setErrorMsg("");

    try {
      const totalWithFee = price * PLATFORM_FEE_MULTIPLIER;
      const ethAmount = totalWithFee / ETH_USD_PRICE;
      const amount = parseEther(ethAmount.toFixed(18));

      // Deposit ETH into escrow
      const depositTx = await writeContract(wagmiConfig, {
        address: escrowAddress,
        abi: ESCROW_ABI,
        functionName: "deposit",
        args: [recipientAddress, zeroAddress, amount, `Product: ${productTitle}`],
        value: amount,
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
      const result = await createTransaction(productId, depositTx, address, nativeCurrency.symbol, registration, chainId);
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

  if (!isConnected) return null;

  if (!escrowAddress) {
    return <span className="text-sobek-green-light/60 text-sm">Not available on this network</span>;
  }

  if (status === "success") {
    return <span className="text-sobek-gold text-sm font-medium">Paid</span>;
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-1">
        <Button size="sm" variant="outline" onClick={handleBuy}>Retry</Button>
        <span className="text-red-400 text-xs max-w-[120px] truncate" title={errorMsg}>
          {errorMsg}
        </span>
      </div>
    );
  }

  const isLoading = status === "depositing" || status === "submitting";

  return (
    <Button size="sm" variant="outline" onClick={handleBuy} disabled={isLoading}>
      {status === "depositing" && "Depositing..."}
      {status === "submitting" && "Creating transaction..."}
      {status === "idle" && `$${(price * PLATFORM_FEE_MULTIPLIER).toFixed(2)} in ${nativeCurrency.symbol}`}
    </Button>
  );
}
