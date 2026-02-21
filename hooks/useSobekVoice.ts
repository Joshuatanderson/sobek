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
import { parseUnits, parseEther, formatUnits, erc20Abi, parseAbi, decodeEventLog, zeroAddress } from "viem";
import { wagmiConfig } from "@/config/wagmi";
import { USDC_BY_CHAIN, ETH_USD_PRICE, ESCROW_BY_CHAIN, PLATFORM_FEE_MULTIPLIER } from "@/config/constants";
import { TOKENS_BY_CHAIN, SUPPORTED_TOKENS } from "@/config/tokens";
import { createTransaction } from "@/app/product/actions";

export interface Message {
  role: "user" | "agent";
  text: string;
}

const ESCROW_ABI = parseAbi([
  "function deposit(address receiver, address token, uint256 value, string details) payable",
  "event Deposit(address indexed depositor, address indexed receiver, address token, uint256 amount, uint256 indexed registration, string details)",
]);

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

  const TAG = "[sobek-voice]";

  const conversation = useConversation({
    micMuted: muted,
    onConnect: ({ conversationId }) => {
      console.log(`${TAG} CONNECTED — conversationId=${conversationId}`);
    },
    onDisconnect: (details) => {
      console.warn(
        `${TAG} DISCONNECTED — reason=${details.reason}`,
        "closeCode" in details ? `code=${details.closeCode}` : "",
        "closeReason" in details ? `closeReason="${details.closeReason}"` : "",
        "message" in details ? `message="${details.message}"` : "",
        details,
      );
    },
    onStatusChange: ({ status }) => {
      console.log(`${TAG} status → ${status}`);
    },
    onModeChange: ({ mode }) => {
      console.log(`${TAG} mode → ${mode}`);
    },
    onInterruption: (props) => {
      console.log(`${TAG} INTERRUPTION`, props);
    },
    onDebug: (props) => {
      console.debug(`${TAG} debug`, props);
    },
    clientTools: {
      navigate_to_page: async ({ query }: { query: string }) => {
        console.log(`${TAG} tool:navigate_to_page query="${query}"`);
        const q = query.toLowerCase();
        const match = PAGES.find((p) => p.keywords.some((k) => q.includes(k)));
        if (!match) {
          console.log(`${TAG} tool:navigate_to_page — no match`);
          return "No matching page found. Do not mention this to the user.";
        }
        console.log(`${TAG} tool:navigate_to_page — navigating to ${match.path}`);
        onNavigateRef.current?.(match.path);
        return "Done. Do not mention this navigation to the user.";
      },
      get_products: async () => {
        console.log(`${TAG} tool:get_products`);
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("products")
            .select("id, title, description, price_usdc, status, users:agent_id(display_name, reputation_score)")
            .order("created_at", { ascending: false });

          if (error) return "Sorry, I couldn't fetch the products right now.";
          if (!data || data.length === 0) return "There are no products available right now.";

          const lines = data.map((t) => {
            const user = t.users as { display_name: string | null; reputation_score: number | null } | null;
            const creator = user?.display_name || "Anonymous";
            const reputation = user?.reputation_score ?? 0;
            const buyerPrice = (t.price_usdc * PLATFORM_FEE_MULTIPLIER).toFixed(2);
            return `[Product ID: ${t.id}] ${t.title} — ${t.description}. Price: $${buyerPrice} USDC. Status: ${t.status}. Posted by ${creator}. Seller reputation score: ${reputation}.`;
          });
          return `There are ${data.length} products available:\n${lines.join("\n")}`;
        } catch {
          return "Sorry, something went wrong fetching products.";
        }
      },
      get_sellers: async () => {
        console.log(`${TAG} tool:get_sellers`);
        try {
          const supabase = createClient();

          // Get all sellers who have at least one product, with their reputation and product count
          const { data: products, error } = await supabase
            .from("products")
            .select("id, title, price_usdc, users:agent_id(display_name, wallet_address, reputation_score)");

          if (error) return "Sorry, I couldn't fetch seller information right now.";
          if (!products || products.length === 0) return "There are no sellers on the platform yet.";

          // Group products by seller
          const sellerMap = new Map<string, {
            name: string;
            wallet: string;
            reputation: number;
            productCount: number;
            products: string[];
          }>();

          for (const p of products) {
            const user = p.users as { display_name: string | null; wallet_address: string; reputation_score: number | null } | null;
            if (!user) continue;
            const key = user.wallet_address;
            const existing = sellerMap.get(key);
            if (existing) {
              existing.productCount++;
              existing.products.push(p.title);
            } else {
              sellerMap.set(key, {
                name: user.display_name || "Anonymous",
                wallet: user.wallet_address,
                reputation: user.reputation_score ?? 0,
                productCount: 1,
                products: [p.title],
              });
            }
          }

          // Sort sellers by reputation descending
          const sellers = Array.from(sellerMap.values()).sort((a, b) => b.reputation - a.reputation);

          const lines = sellers.map((s, i) => {
            const rank = i + 1;
            const productList = s.products.join(", ");
            return `${rank}. ${s.name} — Reputation score: ${s.reputation}. ${s.productCount} product(s): ${productList}.`;
          });

          return `There are ${sellers.length} sellers on the platform, ranked by reputation:\n${lines.join("\n")}`;
        } catch {
          return "Sorry, something went wrong fetching seller information.";
        }
      },
      initiate_payment: async ({ product_id, payment_method }: { product_id: string; payment_method: "usdc" | "native" }) => {
        console.log(`${TAG} tool:initiate_payment product=${product_id} method=${payment_method}`);
        try {
          const account = getAccount(wagmiConfig);
          if (!account.isConnected || !account.address) {
            return "The user's wallet is not connected. Please ask them to connect their wallet first using the button on the page.";
          }

          const chainId = account.chainId;
          const usdcAddress = chainId ? USDC_BY_CHAIN[chainId] : undefined;
          const escrowAddress = chainId ? ESCROW_BY_CHAIN[chainId] : undefined;

          if (!escrowAddress) {
            return "Escrow is not available on the current network. Please switch to Base.";
          }

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
          const totalWithFee = priceUsdc * PLATFORM_FEE_MULTIPLIER;
          let txHash: `0x${string}`;

          if (payment_method === "usdc") {
            const amount = parseUnits(totalWithFee.toFixed(6), 6);

            // Approve escrow contract to spend USDC
            const approveTx = await writeContract(wagmiConfig, {
              address: usdcAddress!,
              abi: erc20Abi,
              functionName: "approve",
              args: [escrowAddress, amount],
            });
            await waitForTransactionReceipt(wagmiConfig, { hash: approveTx });

            // Deposit into escrow
            txHash = await writeContract(wagmiConfig, {
              address: escrowAddress,
              abi: ESCROW_ABI,
              functionName: "deposit",
              args: [recipientAddress, usdcAddress!, amount, `Product: ${product.title}`],
            });
          } else {
            const ethAmount = totalWithFee / ETH_USD_PRICE;
            const amount = parseEther(ethAmount.toFixed(18));

            // Deposit ETH into escrow
            txHash = await writeContract(wagmiConfig, {
              address: escrowAddress,
              abi: ESCROW_ABI,
              functionName: "deposit",
              args: [recipientAddress, zeroAddress, amount, `Product: ${product.title}`],
              value: amount,
            });
          }

          // Wait for deposit tx and parse registration from Deposit event
          const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
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
              // Not our event, skip
            }
          }

          const currency = payment_method === "usdc" ? "USDC" : "ETH";
          const orderResult = await createTransaction(product_id, txHash, account.address!, currency, registration, chainId);

          if (orderResult.error) {
            return `Payment went through on-chain (tx: ${txHash}), but there was an issue recording the transaction: ${orderResult.error.message}. The funds are held safely in escrow.`;
          }

          return `Payment successful! The transaction for "${product.title}" has been placed via escrow. Transaction hash: ${txHash}.`;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message.split("\n")[0] : "Unknown error";
          return `Payment failed: ${message}. The user may have rejected the transaction or there was a network issue.`;
        }
      },
      initiate_swap: async ({ tokenIn, tokenOut, amount }: { tokenIn: string; tokenOut: string; amount: string }) => {
        console.log(`${TAG} tool:initiate_swap ${amount} ${tokenIn} → ${tokenOut}`);
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
      console.log(`${TAG} message [${role}]: ${message.slice(0, 120)}${message.length > 120 ? "…" : ""}`);
      setMessages((prev) => [...prev, { role, text: message }]);
    },
    onError: (message, context) => {
      console.error(`${TAG} ERROR: ${message}`, context);
    },
  });


  const start = useCallback(async () => {
    console.log(`${TAG} start() called — current status=${conversation.status}`);
    if (conversation.status !== "disconnected") {
      console.log(`${TAG} start() skipped — not disconnected`);
      return;
    }
    try {
      console.log(`${TAG} requesting mic access…`);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log(`${TAG} mic granted — starting session agentId=${AGENT_ID}`);
      const sessionId = await conversation.startSession({ agentId: AGENT_ID } as Parameters<
        typeof conversation.startSession
      >[0]);
      console.log(`${TAG} session started — sessionId=${sessionId}`);
    } catch (err) {
      console.error(`${TAG} start() FAILED:`, err);
    }
  }, [conversation]);

  const end = useCallback(async () => {
    console.log(`${TAG} end() called — current status=${conversation.status}`);
    await conversation.endSession();
    console.log(`${TAG} end() complete`);
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
