#!/usr/bin/env node
/**
 * CLI entry point for the astronomy-oracle MCP server.
 */

import { readFileSync } from "node:fs";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
);
console.error(
  `Astronomy Oracle v${pkg.version} — celestial object catalog & observing planner MCP server`,
);

const server = createServer(pkg.version);
const transport = new StdioServerTransport();
await server.connect(transport);

process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await server.close();
  process.exit(0);
});
