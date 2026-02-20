import { getTasks } from "./actions";
import { Header } from "@/components/header";
import { CreateTaskForm } from "./create-task-form";
import { BuyTaskButton } from "@/components/buy-task-button";
import { BuyNativeButton } from "@/components/buy-native-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TaskRow = {
  id: string;
  title: string;
  description: string;
  price_usdc: number;
  status: string;
  users: {
    display_name: string | null;
    telegram_handle: string | null;
    wallet_address: string;
  } | null;
};

function truncateWallet(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function getProviderLabel(user: TaskRow["users"]) {
  if (!user) return "Unknown";
  if (user.display_name) return user.display_name;
  if (user.telegram_handle) return `@${user.telegram_handle}`;
  return truncateWallet(user.wallet_address);
}

export default async function TaskPage() {
  const { data: tasks } = await getTasks();

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0a0f0a] text-white font-sans">
      <Header />

      <div className="w-full max-w-lg mt-8 space-y-8 px-4 sm:px-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-sobek-gold">List a Service</h1>
          <p className="text-sobek-green-light/80">
            List a service on Sobek. Get paid in USDC by humans and agents.
          </p>
        </div>

        <CreateTaskForm />
      </div>

      {/* Tasks table */}
      <div className="w-full max-w-6xl mt-16 space-y-4 px-4 sm:px-8 pb-8">
        <h2 className="text-2xl font-bold text-sobek-gold">Available Services</h2>

        {!tasks || tasks.length === 0 ? (
          <p className="text-sobek-green-light/80">No services listed yet.</p>
        ) : (
          <div className="rounded-lg border border-sobek-forest/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-sobek-forest/30 hover:bg-sobek-forest/20">
                  <TableHead className="text-sobek-green-light/80">Title</TableHead>
                  <TableHead className="text-sobek-green-light/80">Description</TableHead>
                  <TableHead className="text-sobek-green-light/80 text-right">Price (USDC)</TableHead>
                  <TableHead className="text-sobek-green-light/80">Provider</TableHead>
                  <TableHead className="text-sobek-green-light/80"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tasks as TaskRow[]).map((task) => (
                  <TableRow key={task.id} className="border-sobek-forest/30 hover:bg-sobek-forest/20">
                    <TableCell className="font-medium text-sobek-green-light">{task.title}</TableCell>
                    <TableCell className="text-sobek-green-light/70 max-w-xs truncate">{task.description}</TableCell>
                    <TableCell className="text-right text-sobek-green-light">${task.price_usdc.toFixed(2)}</TableCell>
                    <TableCell className="text-sobek-green-light/70">{getProviderLabel(task.users)}</TableCell>
                    <TableCell>
                      {task.users?.wallet_address && (
                        <div className="flex items-center gap-2">
                          <BuyTaskButton
                            taskId={task.id}
                            priceUsdc={task.price_usdc}
                            recipientAddress={task.users.wallet_address as `0x${string}`}
                          />
                          <BuyNativeButton
                            taskId={task.id}
                            price={task.price_usdc}
                            recipientAddress={task.users.wallet_address as `0x${string}`}
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
