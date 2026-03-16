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
});
