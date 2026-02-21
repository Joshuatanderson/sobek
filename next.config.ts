import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      pino: "./lib/empty-module.js",
      "pino-pretty": "./lib/empty-module.js",
      "thread-stream": "./lib/empty-module.js",
      encoding: "./lib/empty-module.js",
    },
  },
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
};

export default nextConfig;
