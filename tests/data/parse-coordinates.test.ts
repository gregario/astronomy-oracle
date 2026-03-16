import { describe, it, expect } from "vitest";
import { parseRA, parseDec } from "../../src/data/parse-coordinates.js";

describe("parseRA", () => {
  it("converts M31 RA to degrees", () => {
    // 00:42:44.35 → (0 + 42/60 + 44.35/3600) * 15 ≈ 10.6848°
    const result = parseRA("00:42:44.35");
    expect(result).toBeCloseTo(10.6848, 3);
  });

  it("converts 12:00:00.00 to 180 degrees", () => {
    expect(parseRA("12:00:00.00")).toBeCloseTo(180, 5);
  });

  it("converts 06:30:00.00 to 97.5 degrees", () => {
    expect(parseRA("06:30:00.00")).toBeCloseTo(97.5, 5);
  });

  it("returns null for empty string", () => {
    expect(parseRA("")).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(parseRA(undefined as unknown as string)).toBeNull();
  });

  it("returns null for malformed RA with only two parts", () => {
    expect(parseRA("12:00")).toBeNull();
  });

  it("handles RA at boundary 23:59:59.99", () => {
    const result = parseRA("23:59:59.99");
    expect(result).toBeDefined();
    expect(result).toBeCloseTo(360 - 0.0004167, 2); // just under 360
    expect(result).toBeLessThan(360);
    expect(result).toBeGreaterThan(359);
  });

  it("handles RA at zero 00:00:00.00", () => {
    expect(parseRA("00:00:00.00")).toBeCloseTo(0, 5);
  });

  it("returns null for non-numeric RA fields", () => {
    expect(parseRA("ab:cd:ef")).toBeNull();
  });
});

describe("parseDec", () => {
  it("converts M31 Dec to degrees", () => {
    // +41:16:08.6 → 41 + 16/60 + 8.6/3600 ≈ 41.2691°
    const result = parseDec("+41:16:08.6");
    expect(result).toBeCloseTo(41.2691, 3);
  });

  it("converts negative declination", () => {
    // -29:00:28.0 → -(29 + 0/60 + 28.0/3600) ≈ -29.0078°
    const result = parseDec("-29:00:28.0");
    expect(result).toBeCloseTo(-29.0078, 3);
  });

  it("converts zero declination", () => {
    expect(parseDec("+00:00:00.0")).toBeCloseTo(0, 5);
  });

  it("handles declination without explicit + sign", () => {
    const result = parseDec("41:16:08.6");
    expect(result).toBeCloseTo(41.2691, 3);
  });

  it("returns null for empty string", () => {
    expect(parseDec("")).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(parseDec(undefined as unknown as string)).toBeNull();
  });

  it("handles Dec at +90 boundary", () => {
    const result = parseDec("+90:00:00.0");
    expect(result).toBeCloseTo(90, 5);
  });

  it("handles Dec at -90 boundary", () => {
    const result = parseDec("-90:00:00.0");
    expect(result).toBeCloseTo(-90, 5);
  });

  it("returns null for malformed Dec with only two parts", () => {
    expect(parseDec("+41:16")).toBeNull();
  });

  it("returns null for non-numeric Dec fields", () => {
    expect(parseDec("+ab:cd:ef")).toBeNull();
  });
});
