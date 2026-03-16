/**
 * search_objects tool — filter and browse the celestial object catalog.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCatalog } from "../data/catalog.js";
import { OBJECT_TYPES, type ObjectTypeCode } from "../types.js";
import { formatSearchResults } from "../format.js";

const typeKeys = Object.keys(OBJECT_TYPES).filter(
  (k) => k !== "NonEx" && k !== "Dup",
) as [string, ...string[]];

export function registerSearchObjects(server: McpServer): void {
  server.tool(
    "search_objects",
    "Search and filter the celestial object catalog by type, constellation, magnitude, angular size, or catalog membership. Returns a formatted table of matching objects sorted by brightness.",
    {
      type: z
        .enum(typeKeys)
        .optional()
        .describe("Object type code (e.g. G=Galaxy, PN=Planetary Nebula, OCl=Open Cluster)"),
      constellation: z
        .string()
        .optional()
        .describe("IAU constellation abbreviation (e.g. Ori, And, Sgr)"),
      maxMagnitude: z
        .number()
        .optional()
        .describe("Maximum (faintest) visual magnitude to include"),
      minMagnitude: z
        .number()
        .optional()
        .describe("Minimum (brightest) visual magnitude to include"),
      minSize: z
        .number()
        .optional()
        .describe("Minimum angular size in arcminutes"),
      catalog: z
        .enum(["messier", "caldwell", "ngc", "ic"])
        .optional()
        .describe("Filter by catalog membership"),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum number of results (default 20, max 100)"),
    },
    async (params) => {
      const store = await getCatalog();
      const {
        type,
        constellation,
        maxMagnitude,
        minMagnitude,
        minSize,
        catalog: catalogFilter,
        limit,
      } = params as {
        type?: string;
        constellation?: string;
        maxMagnitude?: number;
        minMagnitude?: number;
        minSize?: number;
        catalog?: string;
        limit?: number;
      };

      const maxResults = limit ?? 20;

      let results = [...store.all.values()];

      // Filter by type
      if (type) {
        results = results.filter((obj) => obj.type === type as ObjectTypeCode);
      }

      // Filter by constellation
      if (constellation) {
        const lc = constellation.toLowerCase();
        results = results.filter(
          (obj) => obj.constellation.toLowerCase() === lc,
        );
      }

      // Filter by max magnitude (faintest)
      if (maxMagnitude !== undefined) {
        results = results.filter(
          (obj) => obj.magnitude !== null && obj.magnitude <= maxMagnitude,
        );
      }

      // Filter by min magnitude (brightest)
      if (minMagnitude !== undefined) {
        results = results.filter(
          (obj) => obj.magnitude !== null && obj.magnitude >= minMagnitude,
        );
      }

      // Filter by minimum angular size
      if (minSize !== undefined) {
        results = results.filter(
          (obj) => obj.majorAxis !== null && obj.majorAxis >= minSize,
        );
      }

      // Filter by catalog
      if (catalogFilter) {
        switch (catalogFilter) {
          case "messier":
            results = results.filter((obj) => obj.messier !== null);
            break;
          case "ngc":
            results = results.filter((obj) => obj.name.startsWith("NGC"));
            break;
          case "ic":
            results = results.filter((obj) => obj.name.startsWith("IC"));
            break;
          case "caldwell":
            // Caldwell objects have "C" in otherIdentifiers — approximate
            results = results.filter(
              (obj) =>
                obj.otherIdentifiers !== null &&
                /\bC\d+\b/.test(obj.otherIdentifiers),
            );
            break;
        }
      }

      // Sort by magnitude (brightest first, nulls last)
      results.sort((a, b) => {
        if (a.magnitude === null && b.magnitude === null) return 0;
        if (a.magnitude === null) return 1;
        if (b.magnitude === null) return -1;
        return a.magnitude - b.magnitude;
      });

      // Apply limit
      results = results.slice(0, maxResults);

      return {
        content: [
          {
            type: "text" as const,
            text: formatSearchResults(results),
          },
        ],
      };
    },
  );
}
