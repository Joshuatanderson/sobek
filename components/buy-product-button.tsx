"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { erc20Abi } from "viem";
import { USDC_BY_CHAIN } from "@/config/constants";
import { createOrder } from "@/app/product/actions";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function BuyProductButton({
  productId,
  priceUsdc,
  recipientAddress,
}: {
  productId: string;
  priceUsdc: number;
  recipientAddress: `0x${string}`;
}) {
  const { isConnected, address, chainId } = useAccount();
  const usdcAddress = chainId ? USDC_BY_CHAIN[chainId] : undefined;
  const [status, setStatus] = useState<"idle" | "confirming" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    data: txHash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isSuccess: isTxConfirmed, isError: isTxError } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Handle write error
  useEffect(() => {
    if (writeError) {
      setStatus("error");
      setErrorMsg(writeError.message.split("\n")[0]);
    }
  }, [writeError]);

  // Handle tx confirmation
  useEffect(() => {
    if (isTxConfirmed && txHash) {
      setStatus("submitting");
      createOrder(productId, txHash, address!)
        .then((result) => {
          if (result.error) {
            setStatus("error");
            setErrorMsg(result.error.message);
          } else {
            setStatus("success");
          }
        })
        .catch(() => {
          setStatus("error");
          setErrorMsg("Failed to create order");
        });
    }
    if (isTxError) {
      setStatus("error");
      setErrorMsg("Transaction failed on-chain");
    }
  }, [isTxConfirmed, isTxError, txHash, productId]);

  function handleBuy() {
    if (!usdcAddress) return;
    setStatus("confirming");
    setErrorMsg("");
    writeContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [recipientAddress, parseUnits(priceUsdc.toString(), 6)],
    });
  }

  if (!isConnected) {
    return (
      <span className="text-sobek-green-light/60 text-sm">Connect wallet</span>
    );
  }

  if (!usdcAddress) {
    return (
      <span className="text-sobek-green-light/60 text-sm">USDC not available on this network</span>
    );
  }

  if (status === "success") {
    return <span className="text-sobek-gold text-sm font-medium">Paid</span>;
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-1">
        <Button size="sm" onClick={handleBuy}>
          Retry
        </Button>
        <span className="text-red-400 text-xs max-w-[120px] truncate" title={errorMsg}>
          {errorMsg}
        </span>
      </div>
    );
  }

  const isLoading = status === "confirming" || status === "submitting" || isWritePending;

  return (
    <Button size="sm" onClick={handleBuy} disabled={isLoading}>
      {status === "confirming" && "Confirm in wallet..."}
      {status === "submitting" && "Creating order..."}
      {status === "idle" && `Buy $${priceUsdc.toFixed(2)}`}
    </Button>
  );
}
