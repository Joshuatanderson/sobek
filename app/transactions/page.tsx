import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DisputeActions } from "./dispute-actions";

type TransactionRow = {
  id: string;
  status: string;
  escrow_status: string | null;
  tx_hash: string | null;
  created_at: string | null;
  paid_at: string | null;
  release_at: string | null;
  escrow_registration: number | null;
  product_id: string | null;
  client_id: string | null;
};

function truncateHash(hash: string) {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(escrowStatus: string | null) {
  const colors: Record<string, string> = {
    active: "bg-amber-900/40 text-amber-400 border-amber-700/50",
    pending_schedule: "bg-yellow-900/40 text-yellow-400 border-yellow-700/50",
    releasing: "bg-blue-900/40 text-blue-400 border-blue-700/50",
    disputed: "bg-red-900/40 text-red-400 border-red-700/50",
    refunded: "bg-red-900/40 text-red-400 border-red-700/50",
    released: "bg-green-900/40 text-green-400 border-green-700/50",
  };

  // 'none' or null → paid (no escrow involved)
  const label = !escrowStatus || escrowStatus === "none" ? "paid" : escrowStatus;
  const cls = colors[label] ?? "bg-green-900/40 text-green-400 border-green-700/50";

  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  );
}

function TransactionsTableSkeleton() {
  return (
    <div className="rounded-lg border border-sobek-forest/30 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-sobek-forest/30">
            <TableHead className="text-sobek-green-light/80">Product</TableHead>
            <TableHead className="text-sobek-green-light/80 text-right">Amount</TableHead>
            <TableHead className="text-sobek-green-light/80">Buyer</TableHead>
            <TableHead className="text-sobek-green-light/80">Status</TableHead>
            <TableHead className="text-sobek-green-light/80">Tx</TableHead>
            <TableHead className="text-sobek-green-light/80">Date</TableHead>
            <TableHead className="text-sobek-green-light/80">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i} className="border-sobek-forest/30">
              <TableCell><Skeleton className="h-4 w-32 bg-sobek-forest/30" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto bg-sobek-forest/30" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24 bg-sobek-forest/30" /></TableCell>
              <TableCell><Skeleton className="h-5 w-14 bg-sobek-forest/30" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20 bg-sobek-forest/30" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28 bg-sobek-forest/30" /></TableCell>
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

async function TransactionsTable() {
  const supabase = await createClient();

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("id, status, escrow_status, tx_hash, created_at, paid_at, release_at, escrow_registration, product_id, client_id")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-red-400">Failed to load transactions: {error.message}</p>;
  }

  if (!transactions || transactions.length === 0) {
    return <p className="text-sobek-green-light/80">No transactions yet.</p>;
  }

  const productIds = [...new Set(transactions.map((t) => t.product_id).filter(Boolean))] as string[];
  const clientIds = [...new Set(transactions.map((t) => t.client_id).filter(Boolean))] as string[];

  const [productsRes, usersRes] = await Promise.all([
    productIds.length > 0
      ? supabase.from("products").select("id, title, price_usdc").in("id", productIds)
      : { data: [] },
    clientIds.length > 0
      ? supabase.from("users").select("id, display_name, wallet_address").in("id", clientIds)
      : { data: [] },
  ]);

  const productsMap = new Map((productsRes.data ?? []).map((p) => [p.id, p]));
  const usersMap = new Map((usersRes.data ?? []).map((u) => [u.id, u]));

  return (
    <div className="rounded-lg border border-sobek-forest/30 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-sobek-forest/30 hover:bg-sobek-forest/20">
            <TableHead className="text-sobek-green-light/80">Product</TableHead>
            <TableHead className="text-sobek-green-light/80 text-right">Amount</TableHead>
            <TableHead className="text-sobek-green-light/80">Buyer</TableHead>
            <TableHead className="text-sobek-green-light/80">Status</TableHead>
            <TableHead className="text-sobek-green-light/80">Tx</TableHead>
            <TableHead className="text-sobek-green-light/80">Date</TableHead>
            <TableHead className="text-sobek-green-light/80">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(transactions as TransactionRow[]).map((transaction) => {
            const product = transaction.product_id ? productsMap.get(transaction.product_id) : null;
            const buyer = transaction.client_id ? usersMap.get(transaction.client_id) : null;
            return (
              <TableRow key={transaction.id} className="border-sobek-forest/30 hover:bg-sobek-forest/20">
                <TableCell className="font-medium text-sobek-green-light">
                  {product?.title ?? "Unknown"}
                </TableCell>
                <TableCell className="text-right text-sobek-green-light">
                  {product ? `$${product.price_usdc.toFixed(2)}` : "\u2014"}
                </TableCell>
                <TableCell className="text-sobek-green-light/70">
                  {buyer?.display_name ??
                    (buyer?.wallet_address
                      ? truncateHash(buyer.wallet_address)
                      : "Unknown")}
                </TableCell>
                <TableCell>{statusBadge(transaction.escrow_status)}</TableCell>
                <TableCell className="text-sobek-green-light/70 font-mono text-xs">
                  {transaction.tx_hash ? truncateHash(transaction.tx_hash) : "\u2014"}
                </TableCell>
                <TableCell className="text-sobek-green-light/70 text-xs">
                  {formatDate(transaction.created_at)}
                </TableCell>
                <TableCell>
                  {transaction.escrow_status === "disputed" && (
                    <DisputeActions transactionId={transaction.id} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0a0f0a] text-white font-sans">
      <Header />

      <div className="w-full max-w-6xl mt-8 space-y-4 px-4 sm:px-8 pb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-sobek-gold">Transactions</h1>
          <p className="text-sobek-green-light/80">
            All transactions placed through Sobek.
          </p>
        </div>

        <Suspense fallback={<TransactionsTableSkeleton />}>
          <TransactionsTable />
        </Suspense>
      </div>
    </div>
  );
}
