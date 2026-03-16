/**
 * Core data types for the astronomy-oracle MCP server.
 */

/** Map of OpenNGC object type codes to human-readable names. */
export const OBJECT_TYPES = {
  "*": "Star",
  "**": "Double Star",
  "*Ass": "Stellar Association",
  OCl: "Open Cluster",
  GCl: "Globular Cluster",
  "Cl+N": "Cluster + Nebula",
  G: "Galaxy",
  GPair: "Galaxy Pair",
  GTrpl: "Galaxy Triplet",
  GGroup: "Galaxy Group",
  PN: "Planetary Nebula",
  HII: "HII Region",
  DrkN: "Dark Nebula",
  EmN: "Emission Nebula",
  Neb: "Nebula",
  RfN: "Reflection Nebula",
  SNR: "Supernova Remnant",
  Nova: "Nova",
  NonEx: "Non-Existent",
  Dup: "Duplicate",
  Other: "Other",
} as const;

/** Valid object type codes from the OpenNGC catalog. */
export type ObjectTypeCode = keyof typeof OBJECT_TYPES;

/** A parsed celestial object from the catalog. */
export interface CelestialObject {
  name: string;
  type: ObjectTypeCode;
  typeName: string;
  ra: number;
  dec: number;
  constellation: string;
  magnitude: number | null;
  surfaceBrightness: number | null;
  majorAxis: number | null;
  minorAxis: number | null;
  positionAngle: number | null;
  hubbleType: string | null;
  messier: string | null;
  ngcCrossRef: string | null;
  icCrossRef: string | null;
  commonName: string | null;
  otherIdentifiers: string | null;
}

/** Supported catalog identifiers. */
export type Catalog = "messier" | "caldwell" | "ngc" | "ic";

/** Visibility information for an object at a given time and location. */
export interface VisibilityInfo {
  altitude: number;
  azimuth: number;
  riseTime: Date | null;
  transitTime: Date | null;
  setTime: Date | null;
  isCircumpolar: boolean;
  neverRises: boolean;
}

/** Time window within an observing session. */
export type SessionWindow = "evening" | "midnight" | "predawn";

/** An object scored and scheduled within an observing session. */
export interface SessionObject {
  object: CelestialObject;
  peakAltitude: number;
  transitTime: Date;
  window: SessionWindow;
  score: number;
}
