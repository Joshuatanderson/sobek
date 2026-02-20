"use client";

import { useAccount, useChains, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { createOrder } from "@/app/task/actions";
import { ETH_USD_PRICE } from "@/config/constants";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function BuyNativeButton({
  taskId,
  price,
  recipientAddress,
}: {
  taskId: string;
  price: number;
  recipientAddress: `0x${string}`;
}) {
  const { isConnected, address } = useAccount();
  const chains = useChains();
  const nativeCurrency = chains[0].nativeCurrency;
  const nativeAmount = price / ETH_USD_PRICE;
  const [status, setStatus] = useState<"idle" | "confirming" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    data: txHash,
    sendTransaction,
    isPending: isSendPending,
    error: sendError,
  } = useSendTransaction();

  const { isSuccess: isTxConfirmed, isError: isTxError } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (sendError) {
      setStatus("error");
      setErrorMsg(sendError.message.split("\n")[0]);
    }
  }, [sendError]);

  useEffect(() => {
    if (isTxConfirmed && txHash) {
      setStatus("submitting");
      createOrder(taskId, txHash, address!, nativeCurrency.symbol)
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
  }, [isTxConfirmed, isTxError, txHash, taskId, nativeCurrency.symbol]);

  function handleBuy() {
    setStatus("confirming");
    setErrorMsg("");
    sendTransaction({
      to: recipientAddress,
      value: parseEther(nativeAmount.toFixed(18)),
    });
  }

  if (!isConnected) return null;

  if (status === "success") {
    return <span className="text-sobek-gold text-sm font-medium">Paid</span>;
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-1">
        <Button size="sm" variant="outline" onClick={handleBuy}>
          Retry
        </Button>
        <span className="text-red-400 text-xs max-w-[120px] truncate" title={errorMsg}>
          {errorMsg}
        </span>
      </div>
    );
  }

  const isLoading = status === "confirming" || status === "submitting" || isSendPending;

  return (
    <Button size="sm" variant="outline" onClick={handleBuy} disabled={isLoading}>
      {status === "confirming" && "Confirm in wallet..."}
      {status === "submitting" && "Creating order..."}
      {status === "idle" && `$${price.toFixed(2)} in ${nativeCurrency.symbol}`}
    </Button>
  );
}
