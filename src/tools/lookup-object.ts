/**
 * lookup_object tool — find a celestial object by name, designation, or common name.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCatalog, type CatalogStore } from "../data/catalog.js";
import { fuzzySearch } from "../lib/search.js";
import { riseTransitSet } from "../astro/visibility.js";
import { formatObject } from "../format.js";

function findObject(
  store: CatalogStore,
  name: string,
) {
  // Try exact Messier match (uppercase)
  const upperName = name.toUpperCase();
  const messierMatch = store.byMessier.get(upperName);
  if (messierMatch) return messierMatch;

  // Try exact primary name match
  const byNameMatch = store.byName.get(name);
  if (byNameMatch) return byNameMatch;

  // Try exact common name match (lowercase)
  const commonMatch = store.byCommonName.get(name.toLowerCase());
  if (commonMatch) return commonMatch;

  // Fuzzy search fallback
  const allObjects = [...store.all.values()];
  const fuzzyResults = fuzzySearch(allObjects, name, [
    "name",
    "messier",
    "commonName",
    "otherIdentifiers",
  ]);
  return fuzzyResults.length > 0 ? fuzzyResults[0] : null;
}

export function registerLookupObject(server: McpServer): void {
  server.tool(
    "lookup_object",
    "Look up a celestial object by Messier number (e.g. M31), NGC/IC designation (e.g. NGC7000), or common name (e.g. Andromeda Galaxy). Optionally compute visibility from a given location and time.",
    {
      name: z
        .string()
        .describe(
          "Object name, Messier number, NGC/IC designation, or common name",
        ),
      latitude: z
        .number()
        .min(-90)
        .max(90)
        .optional()
        .describe("Observer latitude in degrees (-90 to 90)"),
      longitude: z
        .number()
        .min(-180)
        .max(180)
        .optional()
        .describe("Observer longitude in degrees (-180 to 180)"),
      date: z
        .string()
        .optional()
        .describe("Date/time in ISO 8601 format (defaults to now)"),
    },
    async ({ name, latitude, longitude, date }) => {
      const store = await getCatalog();
      const obj = findObject(store, name);

      if (!obj) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No object found matching "${name}". Try the search_objects tool to browse by type, constellation, or magnitude.`,
            },
          ],
        };
      }

      let visibility;
      if (latitude !== undefined && longitude !== undefined) {
        const obsDate = date ? new Date(date) : new Date();
        visibility = riseTransitSet(
          obj.ra,
          obj.dec,
          latitude as number,
          longitude as number,
          obsDate,
        );
      }

      return {
        content: [
          {
            type: "text" as const,
            text: formatObject(obj as import("../types.js").CelestialObject, visibility),
          },
        ],
      };
    },
  );
}
