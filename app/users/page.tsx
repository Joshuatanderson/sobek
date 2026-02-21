import { Suspense } from "react";
import { getUsers } from "./actions";
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

const NFT_CONTRACT = "0x8004A818BFB912233c491871b3d84c89A494BD9e";

function truncateWallet(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function UsersTableSkeleton() {
  return (
    <div className="rounded-lg border border-sobek-forest/30 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-sobek-forest/30">
            <TableHead className="text-sobek-green-light/80">User</TableHead>
            <TableHead className="text-sobek-green-light/80 text-right">Reputation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i} className="border-sobek-forest/30">
              <TableCell><Skeleton className="h-4 w-32 bg-sobek-forest/30" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto bg-sobek-forest/30" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

async function UsersTable() {
  const { data: users } = await getUsers();

  if (!users || users.length === 0) {
    return <p className="text-sobek-green-light/80">No users yet.</p>;
  }

  return (
    <div className="rounded-lg border border-sobek-forest/30 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-sobek-forest/30 hover:bg-sobek-forest/20">
            <TableHead className="text-sobek-green-light/80">User</TableHead>
            <TableHead className="text-sobek-green-light/80 text-right">Reputation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const label = user.display_name || truncateWallet(user.wallet_address);
            const hasAgent = user.erc8004_agent_id != null;

            return (
              <TableRow key={user.wallet_address} className="border-sobek-forest/30 hover:bg-sobek-forest/20">
                <TableCell className="font-medium text-sobek-green-light">
                  {hasAgent ? (
                    <a
                      href={`https://sepolia.basescan.org/nft/${NFT_CONTRACT}/${user.erc8004_agent_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-sobek-gold transition-colors"
                    >
                      {label}
                    </a>
                  ) : (
                    label
                  )}
                </TableCell>
                <TableCell className="text-right text-sobek-green-light/70">
                  {user.reputation_sum != null ? user.reputation_sum : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function UsersPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0a0f0a] text-white font-sans">
      <Header />

      <div className="w-full max-w-6xl mt-8 space-y-4 px-4 sm:px-8 pb-8">
        <h1 className="text-3xl font-bold text-sobek-gold">Users</h1>
        <Suspense fallback={<UsersTableSkeleton />}>
          <UsersTable />
        </Suspense>
      </div>
    </div>
  );
}
