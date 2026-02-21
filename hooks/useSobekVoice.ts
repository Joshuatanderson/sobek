"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { USDC_BY_CHAIN, ETH_USD_PRICE } from "@/config/constants";
import { TOKENS_BY_CHAIN, SUPPORTED_TOKENS } from "@/config/tokens";
import { createOrder } from "@/app/product/actions";

export interface Message {
  role: "user" | "agent";
  text: string;
}

const AGENT_ID = "agent_7901khta30m9ehv9b3d5jvdx1qmh";

const PAGES = [
  { id: "home", keywords: ["home", "store", "storefront", "homepage", "main"], path: "/ecommerce" },
  { id: "h100", keywords: ["h100", "nvidia", "gpu", "tensor", "graphics card"], path: "/ecommerce/product" },
];

interface SobekVoiceOptions {
  onNavigate?: (path: string) => void;
}

export function useSobekVoice({ onNavigate }: SobekVoiceOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [muted, setMuted] = useState(false);
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  const conversation = useConversation({
    micMuted: muted,
    clientTools: {
      navigate_to_page: async ({ query }: { query: string }) => {
        const q = query.toLowerCase();
        const match = PAGES.find((p) => p.keywords.some((k) => q.includes(k)));
        if (!match) return "No matching page found. Do not mention this to the user.";
        onNavigateRef.current?.(match.path);
        return "Done. Do not mention this navigation to the user.";
      },
      get_products: async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("products")
            .select("id, title, description, price_usdc, status, users:agent_id(display_name, telegram_handle)")
            .order("created_at", { ascending: false });

          if (error) return "Sorry, I couldn't fetch the products right now.";
          if (!data || data.length === 0) return "There are no products available right now.";

          const lines = data.map((t) => {
            const user = t.users as { display_name: string | null; telegram_handle: string | null } | null;
            const creator = user?.display_name || user?.telegram_handle || "Anonymous";
            return `[Product ID: ${t.id}] ${t.title} — ${t.description}. Price: $${t.price_usdc} USDC. Status: ${t.status}. Posted by ${creator}.`;
          });
          return `There are ${data.length} products available:\n${lines.join("\n")}`;
        } catch {
          return "Sorry, something went wrong fetching products.";
        }
      },
      initiate_payment: async ({ product_id, payment_method }: { product_id: string; payment_method: "usdc" | "native" }) => {
        try {
          const account = getAccount(wagmiConfig);
          if (!account.isConnected || !account.address) {
            return "The user's wallet is not connected. Please ask them to connect their wallet first using the button on the page.";
          }

          const chainId = account.chainId;
          const usdcAddress = chainId ? USDC_BY_CHAIN[chainId] : undefined;

          if (payment_method === "usdc" && !usdcAddress) {
            return "USDC is not available on the current network. Please switch to Base or use native ETH for payment.";
          }

          const supabase = createClient();
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("id, title, price_usdc, users:agent_id(wallet_address)")
            .eq("id", product_id)
            .single();

          if (productError || !product) {
            return "I couldn't find that product. It may have been removed.";
          }

          const user = product.users as { wallet_address: string } | null;
          if (!user?.wallet_address) {
            return "The product provider hasn't set up a wallet address to receive payments.";
          }

          const recipientAddress = user.wallet_address as `0x${string}`;
          const priceUsdc = product.price_usdc;
          let txHash: `0x${string}`;

          if (payment_method === "usdc") {
            txHash = await writeContract(wagmiConfig, {
              address: usdcAddress!,
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
          const orderResult = await createOrder(product_id, txHash, account.address!, currency);

          if (orderResult.error) {
            return `Payment went through on-chain (tx: ${txHash}), but there was an issue recording the order: ${orderResult.error.message}. The provider will still receive the funds.`;
          }

          return `Payment successful! The order for "${product.title}" has been placed. Transaction hash: ${txHash}.`;
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

          const chainId = account.chainId;
          const chainTokens = chainId ? TOKENS_BY_CHAIN[chainId] : undefined;
          if (!chainTokens || Object.keys(chainTokens).length <= 1) {
            return "Swaps are not supported on the current network. Please switch to Base.";
          }

          const inToken = chainTokens[tokenIn.toUpperCase()];
          const outToken = chainTokens[tokenOut.toUpperCase()];
          if (!inToken || !outToken) {
            return `Unsupported token on this network. Supported tokens: ${Object.keys(chainTokens).join(", ")}`;
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
              tokenInChainId: chainId,
              tokenOutChainId: chainId,
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
                chainId,
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
