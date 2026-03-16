import { describe, it, expect } from "vitest";
import { hourAngle, altAz } from "../../src/astro/coordinates.js";

describe("hourAngle", () => {
  it("returns 0 when LST equals RA", () => {
    expect(hourAngle(90, 90)).toBeCloseTo(0, 4);
  });

  it("returns positive value when LST > RA", () => {
    expect(hourAngle(100, 90)).toBeCloseTo(10, 4);
  });

  it("wraps negative to 0-360 range", () => {
    const ha = hourAngle(10, 350);
    expect(ha).toBeCloseTo(20, 4);
  });

  it("always returns a value in 0-360 range", () => {
    const cases = [
      [0, 0],
      [0, 359],
      [359, 0],
      [180, 270],
    ];
    for (const [lst, ra] of cases) {
      const ha = hourAngle(lst, ra);
      expect(ha).toBeGreaterThanOrEqual(0);
      expect(ha).toBeLessThan(360);
    }
  });
});

describe("altAz", () => {
  it("object at zenith: dec=lat, HA=0 → altitude≈90°", () => {
    const result = altAz(0, 45, 45);
    expect(result.altitude).toBeCloseTo(90, 0);
  });

  it("Polaris (dec≈89.26°) from London (51.5°N), HA≈0 → altitude≈51.5°", () => {
    // Polaris: dec ~89.26°, very close to NCP
    // From lat 51.5°N, altitude of the pole ≈ latitude
    // With dec=89.26 and HA=0, altitude should be close to 51.5° but not exact
    // (it's 90 - |lat - dec| when HA=0, so 90 - |51.5 - 89.26| = 90 - 37.76 = 52.24)
    const result = altAz(0, 89.26, 51.5);
    expect(result.altitude).toBeCloseTo(52.24, 0);
  });

  it("object on horizon: HA=90°, dec=0°, lat=0° → altitude≈0°", () => {
    const result = altAz(90, 0, 0);
    expect(result.altitude).toBeCloseTo(0, 0);
  });

  it("azimuth is in 0-360 range", () => {
    const cases = [
      { ha: 0, dec: 45, lat: 45 },
      { ha: 90, dec: 0, lat: 0 },
      { ha: 180, dec: 30, lat: 40 },
      { ha: 270, dec: -20, lat: 50 },
    ];
    for (const { ha, dec, lat } of cases) {
      const result = altAz(ha, dec, lat);
      expect(result.azimuth).toBeGreaterThanOrEqual(0);
      expect(result.azimuth).toBeLessThan(360);
    }
  });

  it("object due south at transit from northern hemisphere: dec<lat, HA=0 → azimuth≈180°", () => {
    // Object at dec=30° transiting from lat=51.5° → due south
    const result = altAz(0, 30, 51.5);
    expect(result.azimuth).toBeCloseTo(180, 0);
  });

  it("object due north at transit: dec>lat, HA=0 → azimuth≈0° (or 360°)", () => {
    // Object at dec=80° transiting from lat=51.5° → due north
    const result = altAz(0, 80, 51.5);
    // Azimuth should be 0 or very close to 360
    expect(result.azimuth % 360).toBeCloseTo(0, 0);
  });
});
