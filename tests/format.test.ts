import { describe, it, expect } from "vitest";
import {
  formatObject,
  formatSearchResults,
  formatSessionPlan,
} from "../src/format.js";
import type {
  CelestialObject,
  VisibilityInfo,
  SessionObject,
} from "../src/types.js";

const m31: CelestialObject = {
  name: "NGC0224",
  type: "G",
  typeName: "Galaxy",
  ra: 10.6846,
  dec: 41.2692,
  constellation: "And",
  magnitude: 3.44,
  surfaceBrightness: 23.63,
  majorAxis: 177.83,
  minorAxis: 69.66,
  positionAngle: 35,
  hubbleType: "Sb",
  messier: "M31",
  ngcCrossRef: null,
  icCrossRef: null,
  commonName: "Andromeda Galaxy",
  otherIdentifiers: null,
};

describe("formatObject", () => {
  it("includes Messier designation, name, and common name in title", () => {
    const result = formatObject(m31);
    expect(result).toContain("M31");
    expect(result).toContain("NGC0224");
    expect(result).toContain("Andromeda Galaxy");
  });

  it("includes magnitude", () => {
    const result = formatObject(m31);
    expect(result).toContain("3.44");
  });

  it("includes angular size", () => {
    const result = formatObject(m31);
    expect(result).toContain("177.83");
    expect(result).toContain("69.66");
  });

  it("includes constellation", () => {
    const result = formatObject(m31);
    expect(result).toContain("And");
  });

  it("includes RA label and HMS format", () => {
    const result = formatObject(m31);
    expect(result).toContain("RA");
    // 10.6846 / 15 = 0.71231h => 0h 42m 44.3s
    expect(result).toMatch(/0h\s+42m/);
  });

  it("includes Dec label and DMS format", () => {
    const result = formatObject(m31);
    expect(result).toContain("Dec");
    // 41.2692 => +41° 16' 09.1"
    expect(result).toMatch(/\+41°\s+16'/);
  });

  it("omits visibility section when no visibility provided", () => {
    const result = formatObject(m31);
    expect(result).not.toContain("Current Visibility");
  });

  it("includes visibility section when visibility is provided", () => {
    const visibility: VisibilityInfo = {
      altitude: 45.5,
      azimuth: 180.0,
      riseTime: new Date("2026-03-16T18:00:00Z"),
      transitTime: new Date("2026-03-16T23:30:00Z"),
      setTime: new Date("2026-03-17T05:00:00Z"),
      isCircumpolar: false,
      neverRises: false,
    };
    const result = formatObject(m31, visibility);
    expect(result).toContain("Current Visibility");
    expect(result).toContain("45.5");
    expect(result).toContain("180.0");
  });

  it("shows circumpolar message when object is circumpolar", () => {
    const visibility: VisibilityInfo = {
      altitude: 60.0,
      azimuth: 0.0,
      riseTime: null,
      transitTime: new Date("2026-03-16T23:30:00Z"),
      setTime: null,
      isCircumpolar: true,
      neverRises: false,
    };
    const result = formatObject(m31, visibility);
    expect(result).toMatch(/circumpolar/i);
  });

  it("shows never-rises message when object never rises", () => {
    const visibility: VisibilityInfo = {
      altitude: -30.0,
      azimuth: 0.0,
      riseTime: null,
      transitTime: null,
      setTime: null,
      isCircumpolar: false,
      neverRises: true,
    };
    const result = formatObject(m31, visibility);
    expect(result).toMatch(/never rises/i);
  });
});

describe("formatSearchResults", () => {
  it("returns no-objects message for empty array", () => {
    const result = formatSearchResults([]);
    expect(result).toContain("No objects found");
  });

  it("shows result count", () => {
    const result = formatSearchResults([m31]);
    expect(result).toContain("Found 1 object(s)");
  });

  it("shows result count for multiple objects", () => {
    const result = formatSearchResults([m31, m31]);
    expect(result).toContain("Found 2 object(s)");
  });

  it("returns markdown table with correct columns", () => {
    const result = formatSearchResults([m31]);
    // Header row should have 6 columns separated by |
    const lines = result.split("\n");
    const headerLine = lines.find(
      (l) => l.includes("Name") && l.includes("Type")
    );
    expect(headerLine).toBeDefined();
    // Count pipe separators: | Name | Type | Mag | Size | Constellation | Common Name |
    const pipes = headerLine!.split("|").filter((s) => s.trim().length > 0);
    expect(pipes).toHaveLength(6);
  });

  it("shows Messier designation with NGC in parens", () => {
    const result = formatSearchResults([m31]);
    expect(result).toContain("M31 (NGC0224)");
  });

  it("handles null magnitude with dash", () => {
    const noMag: CelestialObject = {
      ...m31,
      magnitude: null,
    };
    const result = formatSearchResults([noMag]);
    expect(result).toContain("—");
  });
});

describe("formatSessionPlan", () => {
  const makeSessionObject = (
    window: "evening" | "midnight" | "predawn",
    score: number
  ): SessionObject => ({
    object: m31,
    peakAltitude: 65.2,
    transitTime: new Date("2026-03-16T23:30:00Z"),
    window,
    score,
  });

  it("includes title", () => {
    const windows = new Map<string, SessionObject[]>();
    const result = formatSessionPlan(
      windows,
      { lat: 51.5, lon: -0.1 },
      new Date("2026-03-16T00:00:00Z")
    );
    expect(result).toContain("# Observing Session Plan");
  });

  it("includes location", () => {
    const windows = new Map<string, SessionObject[]>();
    const result = formatSessionPlan(
      windows,
      { lat: 51.5, lon: -0.1 },
      new Date("2026-03-16T00:00:00Z")
    );
    expect(result).toContain("51.5");
    expect(result).toContain("-0.1");
  });

  it("shows all three window sections", () => {
    const windows = new Map<string, SessionObject[]>();
    const result = formatSessionPlan(
      windows,
      { lat: 51.5, lon: -0.1 },
      new Date("2026-03-16T00:00:00Z")
    );
    expect(result).toContain("Early Evening");
    expect(result).toContain("Late Night");
    expect(result).toContain("Pre-Dawn");
  });

  it("shows empty-window message when no objects", () => {
    const windows = new Map<string, SessionObject[]>();
    const result = formatSessionPlan(
      windows,
      { lat: 51.5, lon: -0.1 },
      new Date("2026-03-16T00:00:00Z")
    );
    expect(result).toContain("No notable objects in this window");
  });

  it("shows objects in the correct window", () => {
    const windows = new Map<string, SessionObject[]>();
    windows.set("evening", [makeSessionObject("evening", 85)]);
    const result = formatSessionPlan(
      windows,
      { lat: 51.5, lon: -0.1 },
      new Date("2026-03-16T00:00:00Z")
    );
    // Evening section should contain M31
    expect(result).toContain("M31");
    expect(result).toContain("85");
  });

  it("includes score explanation footer", () => {
    const windows = new Map<string, SessionObject[]>();
    const result = formatSessionPlan(
      windows,
      { lat: 51.5, lon: -0.1 },
      new Date("2026-03-16T00:00:00Z")
    );
    expect(result).toMatch(/score/i);
  });
});
