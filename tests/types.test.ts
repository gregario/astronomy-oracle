import { describe, it, expect } from "vitest";
import { OBJECT_TYPES } from "../src/types.js";

describe("OBJECT_TYPES", () => {
  it("has exactly 21 entries", () => {
    expect(Object.keys(OBJECT_TYPES)).toHaveLength(21);
  });

  it("maps star type codes correctly", () => {
    expect(OBJECT_TYPES["*"]).toBe("Star");
    expect(OBJECT_TYPES["**"]).toBe("Double Star");
    expect(OBJECT_TYPES["*Ass"]).toBe("Stellar Association");
  });

  it("maps cluster type codes correctly", () => {
    expect(OBJECT_TYPES.OCl).toBe("Open Cluster");
    expect(OBJECT_TYPES.GCl).toBe("Globular Cluster");
    expect(OBJECT_TYPES["Cl+N"]).toBe("Cluster + Nebula");
  });

  it("maps galaxy type codes correctly", () => {
    expect(OBJECT_TYPES.G).toBe("Galaxy");
    expect(OBJECT_TYPES.GPair).toBe("Galaxy Pair");
    expect(OBJECT_TYPES.GTrpl).toBe("Galaxy Triplet");
    expect(OBJECT_TYPES.GGroup).toBe("Galaxy Group");
  });

  it("maps nebula type codes correctly", () => {
    expect(OBJECT_TYPES.PN).toBe("Planetary Nebula");
    expect(OBJECT_TYPES.HII).toBe("HII Region");
    expect(OBJECT_TYPES.DrkN).toBe("Dark Nebula");
    expect(OBJECT_TYPES.EmN).toBe("Emission Nebula");
    expect(OBJECT_TYPES.Neb).toBe("Nebula");
    expect(OBJECT_TYPES.RfN).toBe("Reflection Nebula");
  });

  it("maps remaining type codes correctly", () => {
    expect(OBJECT_TYPES.SNR).toBe("Supernova Remnant");
    expect(OBJECT_TYPES.Nova).toBe("Nova");
    expect(OBJECT_TYPES.NonEx).toBe("Non-Existent");
    expect(OBJECT_TYPES.Dup).toBe("Duplicate");
    expect(OBJECT_TYPES.Other).toBe("Other");
  });
});
