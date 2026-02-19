import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "pino-pretty": { browser: "./noop.js" },
      encoding: { browser: "./noop.js" },
    },
  },
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
};

export default nextConfig;
