"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AgentDocs({ content }: { content: string }) {
  return (
    <article className="prose prose-invert max-w-none prose-headings:text-sobek-gold prose-h1:text-4xl prose-h1:font-bold prose-h2:text-2xl prose-h2:border-b prose-h2:border-sobek-forest/40 prose-h2:pb-2 prose-h3:text-xl prose-a:text-sobek-gold prose-a:no-underline hover:prose-a:underline prose-strong:text-sobek-green-light prose-code:text-sobek-green-light prose-code:bg-sobek-forest/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-sobek-forest/30 prose-pre:border prose-pre:border-sobek-forest/40 prose-table:border-collapse prose-th:text-sobek-green-light/80 prose-th:border prose-th:border-sobek-forest/40 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-sobek-forest/40 prose-td:px-3 prose-td:py-2 prose-hr:border-sobek-forest/40 text-sobek-green-light/90">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}
