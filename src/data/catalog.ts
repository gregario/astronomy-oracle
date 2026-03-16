/**
 * CSV parser and catalog store for OpenNGC data.
 */

import { readFile } from "node:fs/promises";
import { OBJECT_TYPES, type CelestialObject, type ObjectTypeCode } from "../types.js";
import { parseRA, parseDec } from "./parse-coordinates.js";

/** Indexed catalog store for fast lookups. */
export interface CatalogStore {
  /** All objects keyed by primary name (e.g., "NGC0224", "IC0001", "Mel022"). */
  all: Map<string, CelestialObject>;
  /** Objects keyed by primary name — same as all. */
  byName: Map<string, CelestialObject>;
  /** Objects keyed by Messier designation (e.g., "M31"). */
  byMessier: Map<string, CelestialObject>;
  /** Objects keyed by lowercase common name (e.g., "andromeda galaxy"). */
  byCommonName: Map<string, CelestialObject>;
}

// CSV column indices (0-based, semicolon-delimited)
const COL = {
  NAME: 0,
  TYPE: 1,
  RA: 2,
  DEC: 3,
  CONST: 4,
  MAJ_AX: 5,
  MIN_AX: 6,
  POS_ANG: 7,
  V_MAG: 9,
  SURF_BR: 13,
  HUBBLE: 14,
  M: 23,
  NGC: 24,
  IC: 25,
  IDENTIFIERS: 27,
  COMMON_NAMES: 28,
} as const;

/** Parse a CSV field as a float, returning null for empty/invalid values. */
function parseOptionalFloat(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/** Parse a CSV field as a non-empty string, returning null for empty values. */
function parseOptionalString(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

/** Parse a single CSV row into a CelestialObject, or null if it should be skipped. */
function parseRow(fields: string[]): CelestialObject | null {
  const typeCode = fields[COL.TYPE] as ObjectTypeCode;

  // Filter out non-existent and duplicate entries
  if (typeCode === "NonEx" || typeCode === "Dup") return null;

  // Validate type code
  if (!(typeCode in OBJECT_TYPES)) return null;

  // Parse coordinates — skip rows without valid RA/Dec
  const ra = parseRA(fields[COL.RA]);
  const dec = parseDec(fields[COL.DEC]);
  if (ra === null || dec === null) return null;

  // Build Messier designation — CSV has bare numbers like "031"
  const messierRaw = parseOptionalString(fields[COL.M]);
  const messier = messierRaw ? `M${parseInt(messierRaw, 10)}` : null;

  return {
    name: fields[COL.NAME],
    type: typeCode,
    typeName: OBJECT_TYPES[typeCode],
    ra,
    dec,
    constellation: fields[COL.CONST] || "",
    magnitude: parseOptionalFloat(fields[COL.V_MAG]),
    surfaceBrightness: parseOptionalFloat(fields[COL.SURF_BR]),
    majorAxis: parseOptionalFloat(fields[COL.MAJ_AX]),
    minorAxis: parseOptionalFloat(fields[COL.MIN_AX]),
    positionAngle: parseOptionalFloat(fields[COL.POS_ANG]),
    hubbleType: parseOptionalString(fields[COL.HUBBLE]),
    messier,
    ngcCrossRef: parseOptionalString(fields[COL.NGC]),
    icCrossRef: parseOptionalString(fields[COL.IC]),
    commonName: parseOptionalString(fields[COL.COMMON_NAMES]),
    otherIdentifiers: parseOptionalString(fields[COL.IDENTIFIERS]),
  };
}

/** Parse a semicolon-delimited CSV string into CelestialObject arrays. */
function parseCsv(content: string): CelestialObject[] {
  const lines = content.split("\n");
  const objects: CelestialObject[] = [];

  // Skip header row (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = line.split(";");
    const obj = parseRow(fields);
    if (obj) objects.push(obj);
  }

  return objects;
}

/** Load both NGC.csv and addendum.csv, build indexed catalog store. */
export async function loadCatalog(): Promise<CatalogStore> {
  const dataDir = new URL("../../data/", import.meta.url);

  const [ngcContent, addendumContent] = await Promise.all([
    readFile(new URL("NGC.csv", dataDir), "utf-8"),
    readFile(new URL("addendum.csv", dataDir), "utf-8"),
  ]);

  const ngcObjects = parseCsv(ngcContent);
  const addendumObjects = parseCsv(addendumContent);
  const allObjects = [...ngcObjects, ...addendumObjects];

  const all = new Map<string, CelestialObject>();
  const byName = all; // Same reference — primary name index
  const byMessier = new Map<string, CelestialObject>();
  const byCommonName = new Map<string, CelestialObject>();

  for (const obj of allObjects) {
    all.set(obj.name, obj);

    if (obj.messier) {
      byMessier.set(obj.messier, obj);
    }

    if (obj.commonName) {
      // Index each common name separately (some entries have multiple, comma-separated)
      // But the field typically has a single primary name
      byCommonName.set(obj.commonName.toLowerCase(), obj);
    }
  }

  return { all, byName, byMessier, byCommonName };
}
