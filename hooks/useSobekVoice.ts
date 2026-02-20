"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  getAccount,
  writeContract,
  sendTransaction,
  waitForTransactionReceipt,
  signTypedData,
} from "@wagmi/core";
import { parseUnits, parseEther, formatUnits, erc20Abi } from "viem";
import { wagmiConfig } from "@/config/wagmi";
import { BASE_USDC_ADDRESS, ETH_USD_PRICE } from "@/config/constants";
import { SUPPORTED_TOKENS } from "@/config/tokens";
import { createOrder } from "@/app/task/actions";

export interface Message {
  role: "user" | "agent";
  text: string;
}

const AGENT_ID = "agent_7901khta30m9ehv9b3d5jvdx1qmh";

export function useSobekVoice() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [muted, setMuted] = useState(false);

  const conversation = useConversation({
    micMuted: muted,
    clientTools: {
      get_tasks: async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("tasks")
            .select("id, title, description, price_usdc, status, users:agent_id(display_name, telegram_handle)")
            .order("created_at", { ascending: false });

          if (error) return "Sorry, I couldn't fetch the tasks right now.";
          if (!data || data.length === 0) return "There are no tasks available right now.";

          const lines = data.map((t) => {
            const user = t.users as { display_name: string | null; telegram_handle: string | null } | null;
            const creator = user?.display_name || user?.telegram_handle || "Anonymous";
            return `[Task ID: ${t.id}] ${t.title} — ${t.description}. Price: $${t.price_usdc} USDC. Status: ${t.status}. Posted by ${creator}.`;
          });
          return `There are ${data.length} tasks available:\n${lines.join("\n")}`;
        } catch {
          return "Sorry, something went wrong fetching tasks.";
        }
      },
      initiate_payment: async ({ task_id, payment_method }: { task_id: string; payment_method: "usdc" | "native" }) => {
        try {
          const account = getAccount(wagmiConfig);
          if (!account.isConnected || !account.address) {
            return "The user's wallet is not connected. Please ask them to connect their wallet first using the button on the page.";
          }

          const supabase = createClient();
          const { data: task, error: taskError } = await supabase
            .from("tasks")
            .select("id, title, price_usdc, users:agent_id(wallet_address)")
            .eq("id", task_id)
            .single();

          if (taskError || !task) {
            return "I couldn't find that task. It may have been removed.";
          }

          const user = task.users as { wallet_address: string } | null;
          if (!user?.wallet_address) {
            return "The task provider hasn't set up a wallet address to receive payments.";
          }

          const recipientAddress = user.wallet_address as `0x${string}`;
          const priceUsdc = task.price_usdc;
          let txHash: `0x${string}`;

          if (payment_method === "usdc") {
            txHash = await writeContract(wagmiConfig, {
              address: BASE_USDC_ADDRESS,
              abi: erc20Abi,
              functionName: "transfer",
              args: [recipientAddress, parseUnits(priceUsdc.toString(), 6)],
            });
          } else {
            const ethAmount = priceUsdc / ETH_USD_PRICE;
            txHash = await sendTransaction(wagmiConfig, {
              to: recipientAddress,
              value: parseEther(ethAmount.toFixed(18)),
            });
          }

          await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

          const currency = payment_method === "usdc" ? "USDC" : "ETH";
          const orderResult = await createOrder(task_id, txHash, account.address!, currency);

          if (orderResult.error) {
            return `Payment went through on-chain (tx: ${txHash}), but there was an issue recording the order: ${orderResult.error.message}. The provider will still receive the funds.`;
          }

          return `Payment successful! The order for "${task.title}" has been placed. Transaction hash: ${txHash}.`;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message.split("\n")[0] : "Unknown error";
          return `Payment failed: ${message}. The user may have rejected the transaction or there was a network issue.`;
        }
      },
      initiate_swap: async ({ tokenIn, tokenOut, amount }: { tokenIn: string; tokenOut: string; amount: string }) => {
        try {
          const account = getAccount(wagmiConfig);
          if (!account.isConnected || !account.address) {
            return "The user's wallet is not connected. Please ask them to connect their wallet first.";
          }

          const inToken = SUPPORTED_TOKENS[tokenIn.toUpperCase()];
          const outToken = SUPPORTED_TOKENS[tokenOut.toUpperCase()];
          if (!inToken || !outToken) {
            return `Unsupported token. Supported tokens: ${Object.keys(SUPPORTED_TOKENS).join(", ")}`;
          }
          if (inToken.symbol === outToken.symbol) {
            return "Cannot swap a token for itself.";
          }

          const amountRaw = parseUnits(amount, inToken.decimals).toString();

          const quoteRes = await fetch("/api/swap/quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tokenIn: inToken.address,
              tokenOut: outToken.address,
              tokenInChainId: 8453,
              tokenOutChainId: 8453,
              amount: amountRaw,
              swapper: account.address,
              type: "EXACT_INPUT",
              slippageTolerance: 0.5,
            }),
          });
          const quote = await quoteRes.json();
          if (!quoteRes.ok) {
            return `Failed to get swap quote: ${quote.detail || quote.errorCode || "Unknown error"}`;
          }

          if (inToken.address !== "0x0000000000000000000000000000000000000000") {
            const approvalRes = await fetch("/api/swap/check-approval", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: inToken.address,
                amount: amountRaw,
                walletAddress: account.address,
                chainId: 8453,
              }),
            });
            const approvalData = await approvalRes.json();

            if (approvalData.approval) {
              const approvalTx = await sendTransaction(wagmiConfig, {
                to: approvalData.approval.to as `0x${string}`,
                data: approvalData.approval.data as `0x${string}`,
                value: BigInt(approvalData.approval.value || "0"),
              });
              await waitForTransactionReceipt(wagmiConfig, { hash: approvalTx });
            }
          }

          let signature: string | undefined;
          if (quote.permitData) {
            const { domain, types, values } = quote.permitData;
            signature = await signTypedData(wagmiConfig, {
              domain,
              types,
              primaryType: "PermitSingle",
              message: values,
            });
          }

          const executeRes = await fetch("/api/swap/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quote: quote.quote,
              permitData: quote.permitData || undefined,
              signature: signature || undefined,
            }),
          });
          const swapData = await executeRes.json();
          if (!executeRes.ok) {
            return `Swap execution failed: ${swapData.detail || swapData.errorCode || "Unknown error"}`;
          }

          const txHash = await sendTransaction(wagmiConfig, {
            to: swapData.swap.to as `0x${string}`,
            data: swapData.swap.data as `0x${string}`,
            value: BigInt(swapData.swap.value || "0"),
          });
          await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

          const outAmount = formatUnits(BigInt(quote.quote.outputAmount || quote.quote.output?.amount || "0"), outToken.decimals);
          return `Swap successful! Swapped ${amount} ${inToken.symbol} for ~${parseFloat(outAmount).toFixed(6)} ${outToken.symbol}. Transaction hash: ${txHash}`;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message.split("\n")[0] : "Unknown error";
          return `Swap failed: ${message}. The user may have rejected the transaction or there was a network issue.`;
        }
      },
    },
    onMessage: ({ message, role }) => {
      setMessages((prev) => [...prev, { role, text: message }]);
    },
    onError: (message) => {
      console.error("Error:", message);
    },
  });

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      conversation.endSession();
    };
  }, [conversation]);

  const start = useCallback(async () => {
    if (conversation.status !== "disconnected") return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({ agentId: AGENT_ID } as Parameters<
        typeof conversation.startSession
      >[0]);
    } catch (err) {
      console.error("Failed to start:", err);
    }
  }, [conversation]);

  const end = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  return {
    messages,
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    muted,
    isConnected: conversation.status === "connected",
    isConnecting: conversation.status === "connecting",
    start,
    end,
    toggleMute,
  };
}
