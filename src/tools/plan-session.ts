/**
 * plan_session tool — generate an observing session plan for a location and date.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadCatalog, type CatalogStore } from "../data/catalog.js";
import { OBJECT_TYPES, type SessionObject, type SessionWindow } from "../types.js";
import { riseTransitSet } from "../astro/visibility.js";
import { formatSessionPlan } from "../format.js";

let catalog: CatalogStore | null = null;

async function getCatalog(): Promise<CatalogStore> {
  if (!catalog) {
    catalog = await loadCatalog();
  }
  return catalog;
}

const typeKeys = Object.keys(OBJECT_TYPES) as [string, ...string[]];

/**
 * Classify a transit time's UTC hour into a session window.
 */
function classifyWindow(transitTime: Date): SessionWindow {
  const hour = transitTime.getUTCHours();
  if (hour >= 18 && hour < 22) return "evening";
  if (hour >= 22 || hour < 2) return "midnight";
  if (hour >= 2 && hour < 6) return "predawn";
  // Default: pick closest window
  if (hour >= 6 && hour < 15) return "predawn"; // morning → predawn is closest
  return "evening"; // afternoon → evening is closest
}

export function registerPlanSession(server: McpServer): void {
  server.tool(
    "plan_session",
    "Generate an observing session plan for a given location and date. Returns the best celestial objects to observe grouped by time window (evening, midnight, pre-dawn), scored by observability.",
    {
      latitude: z
        .number()
        .min(-90)
        .max(90)
        .describe("Observer latitude in degrees (-90 to 90)"),
      longitude: z
        .number()
        .min(-180)
        .max(180)
        .describe("Observer longitude in degrees (-180 to 180)"),
      date: z
        .string()
        .optional()
        .describe("Date in ISO 8601 format (defaults to today)"),
      minAltitude: z
        .number()
        .optional()
        .describe("Minimum peak altitude in degrees (default 15)"),
      maxMagnitude: z
        .number()
        .optional()
        .describe("Maximum (faintest) visual magnitude to include"),
      types: z
        .array(z.enum(typeKeys))
        .optional()
        .describe("Object type codes to include (e.g. [\"G\", \"PN\", \"OCl\"])"),
    },
    async (params) => {
      const store = await getCatalog();
      const {
        latitude,
        longitude,
        date: dateStr,
        minAltitude: minAltParam,
        maxMagnitude,
        types,
      } = params as {
        latitude: number;
        longitude: number;
        date?: string;
        minAltitude?: number;
        maxMagnitude?: number;
        types?: string[];
      };

      const obsDate = dateStr ? new Date(dateStr) : new Date();
      const minAltitude = minAltParam ?? 15;

      // Filter candidates
      let candidates = [...store.all.values()];

      // Only include objects with known magnitude
      candidates = candidates.filter((obj) => obj.magnitude !== null);

      if (maxMagnitude !== undefined) {
        candidates = candidates.filter(
          (obj) => obj.magnitude! <= maxMagnitude,
        );
      }

      if (types && types.length > 0) {
        const typeSet = new Set(types);
        candidates = candidates.filter((obj) => typeSet.has(obj.type));
      }

      // Compute visibility and score each candidate
      const sessionObjects: SessionObject[] = [];

      for (const obj of candidates) {
        const vis = riseTransitSet(obj.ra, obj.dec, latitude, longitude, obsDate);

        // Skip objects that never rise
        if (vis.neverRises) continue;

        // Compute peak altitude: 90 - |lat - dec| (simple approximation)
        const peakAltitude = 90 - Math.abs(latitude - obj.dec);

        // Skip objects that don't reach minAltitude
        if (peakAltitude < minAltitude) continue;

        // Need a transit time for window classification
        const transitTime = vis.transitTime;
        if (!transitTime) continue;

        const window = classifyWindow(transitTime);

        // Score = peakAltitude + max(0, (12 - magnitude) * 5) + min(majorAxis or 0, 30)
        const magBonus = Math.max(0, (12 - (obj.magnitude ?? 12)) * 5);
        const sizeBonus = Math.min(obj.majorAxis ?? 0, 30);
        const score = Math.round(peakAltitude + magBonus + sizeBonus);

        sessionObjects.push({
          object: obj,
          peakAltitude,
          transitTime,
          window,
          score,
        });
      }

      // Group by window, sort by score desc, take top 15 per window
      const windows = new Map<string, SessionObject[]>();
      for (const w of ["evening", "midnight", "predawn"] as const) {
        const inWindow = sessionObjects
          .filter((so) => so.window === w)
          .sort((a, b) => b.score - a.score)
          .slice(0, 15);
        windows.set(w, inWindow);
      }

      return {
        content: [
          {
            type: "text" as const,
            text: formatSessionPlan(windows, { lat: latitude, lon: longitude }, obsDate),
          },
        ],
      };
    },
  );
}
