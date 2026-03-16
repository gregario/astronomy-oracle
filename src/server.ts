/**
 * MCP server factory for astronomy-oracle.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./register-tools.js";

export function createServer(version?: string): McpServer {
  const server = new McpServer({
    name: "astronomy-oracle",
    version: version ?? "0.0.0",
  });
  registerTools(server);
  return server;
}
