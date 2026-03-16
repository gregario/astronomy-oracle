/**
 * Register all MCP tools with the server.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerLookupObject } from "./tools/lookup-object.js";

export function registerTools(server: McpServer): void {
  registerLookupObject(server);
}
