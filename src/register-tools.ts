/**
 * Register all MCP tools with the server.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerLookupObject } from "./tools/lookup-object.js";
import { registerSearchObjects } from "./tools/search-objects.js";
import { registerPlanSession } from "./tools/plan-session.js";

export function registerTools(server: McpServer): void {
  registerLookupObject(server);
  registerSearchObjects(server);
  registerPlanSession(server);
}
