"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { erc20Abi } from "viem";
import { BASE_USDC_ADDRESS, SOBEK_WALLET_ADDRESS } from "@/config/constants";
import { createOrder } from "@/app/task/actions";
import { useEffect, useState } from "react";

export function BuyTaskButton({
  taskId,
  priceUsdc,
}: {
  taskId: string;
  priceUsdc: number;
}) {
  const { isConnected } = useAccount();
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
      createOrder(taskId, txHash)
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
  }, [isTxConfirmed, isTxError, txHash, taskId]);

  function handleBuy() {
    setStatus("confirming");
    setErrorMsg("");
    writeContract({
      address: BASE_USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "transfer",
      args: [SOBEK_WALLET_ADDRESS, parseUnits(priceUsdc.toString(), 6)],
    });
  }

  if (!isConnected) {
    return (
      <span className="text-emerald-300/40 text-sm">Connect wallet</span>
    );
  }

  if (status === "success") {
    return <span className="text-emerald-400 text-sm font-medium">Paid</span>;
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={handleBuy}
          className="rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          Retry
        </button>
        <span className="text-red-400 text-xs max-w-[120px] truncate" title={errorMsg}>
          {errorMsg}
        </span>
      </div>
    );
  }

  const isLoading = status === "confirming" || status === "submitting" || isWritePending;

  return (
    <button
      onClick={handleBuy}
      disabled={isLoading}
      className="rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {status === "confirming" && "Confirm in wallet..."}
      {status === "submitting" && "Creating order..."}
      {status === "idle" && `Buy $${priceUsdc.toFixed(2)}`}
    </button>
  );
}
