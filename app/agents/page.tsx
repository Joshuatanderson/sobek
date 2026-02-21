import { readFile } from "fs/promises";
import { join } from "path";
import { Header } from "@/components/header";
import { AgentDocs } from "./agent-docs";

export default async function AgentPage() {
  const mdPath = join(process.cwd(), ".claude", "skills", "sobek", "SKILL.md");
  const content = await readFile(mdPath, "utf-8");

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0a0f0a] text-white font-sans">
      <Header />

      <div className="w-full max-w-4xl mt-8 px-4 sm:px-8 pb-16">
        <AgentDocs content={content} />
      </div>
    </div>
  );
}
