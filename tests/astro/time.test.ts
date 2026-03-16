import { describe, it, expect } from "vitest";
import {
  julianDate,
  greenwichMeanSiderealTime,
  localSiderealTime,
} from "../../src/astro/time.js";

describe("julianDate", () => {
  it("returns 2451545.0 for J2000.0 epoch (2000-01-01T12:00:00Z)", () => {
    const j2000 = new Date("2000-01-01T12:00:00Z");
    expect(julianDate(j2000)).toBeCloseTo(2451545.0, 4);
  });

  it("returns ~2460389.5 for 2024-03-20T00:00:00Z", () => {
    const date = new Date("2024-03-20T00:00:00Z");
    expect(julianDate(date)).toBeCloseTo(2460389.5, 4);
  });

  it("returns ~2440587.5 for Unix epoch (1970-01-01T00:00:00Z)", () => {
    const unix = new Date("1970-01-01T00:00:00Z");
    expect(julianDate(unix)).toBeCloseTo(2440587.5, 4);
  });
});

describe("greenwichMeanSiderealTime", () => {
  it("returns ~280.46° for J2000.0 epoch", () => {
    const gmst = greenwichMeanSiderealTime(2451545.0);
    expect(gmst).toBeCloseTo(280.46, 1);
  });

  it("returns a value in 0-360 range", () => {
    // Test with various JDs
    const jds = [2451545.0, 2460388.5, 2440587.5];
    for (const jd of jds) {
      const gmst = greenwichMeanSiderealTime(jd);
      expect(gmst).toBeGreaterThanOrEqual(0);
      expect(gmst).toBeLessThan(360);
    }
  });
});

describe("localSiderealTime", () => {
  it("equals GMST at Greenwich (longitude 0)", () => {
    const j2000 = new Date("2000-01-01T12:00:00Z");
    const lst = localSiderealTime(j2000, 0);
    const gmst = greenwichMeanSiderealTime(2451545.0);
    expect(lst).toBeCloseTo(gmst, 4);
  });

  it("returns ~280.46° at Greenwich for J2000 epoch", () => {
    const j2000 = new Date("2000-01-01T12:00:00Z");
    const lst = localSiderealTime(j2000, 0);
    expect(lst).toBeCloseTo(280.46, 1);
  });

  it("shifts by longitude (90° east adds 90°)", () => {
    const date = new Date("2000-01-01T12:00:00Z");
    const lstGreenwich = localSiderealTime(date, 0);
    const lstEast90 = localSiderealTime(date, 90);
    // Difference should be 90° (mod 360)
    const diff = (lstEast90 - lstGreenwich + 360) % 360;
    expect(diff).toBeCloseTo(90, 4);
  });

  it("returns a value in 0-360 range", () => {
    const dates = [
      new Date("2000-01-01T12:00:00Z"),
      new Date("2024-06-15T03:00:00Z"),
      new Date("1999-12-31T23:59:59Z"),
    ];
    const longitudes = [-180, -90, 0, 90, 180];
    for (const date of dates) {
      for (const lon of longitudes) {
        const lst = localSiderealTime(date, lon);
        expect(lst).toBeGreaterThanOrEqual(0);
        expect(lst).toBeLessThan(360);
      }
    }
  });
});
