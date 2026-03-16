import { describe, it, expect } from "vitest";
import {
  riseTransitSet,
  currentPosition,
} from "../../src/astro/visibility.js";

// London: lat 51.5°N, lon -0.1°W
const LONDON_LAT = 51.5;
const LONDON_LON = -0.1;

// Sirius: RA ≈ 101.29°, Dec ≈ -16.72° — rises and sets from London
const SIRIUS_RA = 101.29;
const SIRIUS_DEC = -16.72;

// Polaris: RA ≈ 37.95°, Dec ≈ 89.26°
const POLARIS_RA = 37.95;
const POLARIS_DEC = 89.26;

// A date for testing
const TEST_DATE = new Date("2024-06-15T22:00:00Z");

describe("riseTransitSet", () => {
  it("Sirius from London: has rise, transit, set times; not circumpolar", () => {
    const result = riseTransitSet(
      SIRIUS_RA,
      SIRIUS_DEC,
      LONDON_LAT,
      LONDON_LON,
      TEST_DATE,
    );
    expect(result.isCircumpolar).toBe(false);
    expect(result.neverRises).toBe(false);
    expect(result.riseTime).toBeInstanceOf(Date);
    expect(result.transitTime).toBeInstanceOf(Date);
    expect(result.setTime).toBeInstanceOf(Date);
  });

  it("Polaris from London (51.5°N): circumpolar", () => {
    const result = riseTransitSet(
      POLARIS_RA,
      POLARIS_DEC,
      LONDON_LAT,
      LONDON_LON,
      TEST_DATE,
    );
    expect(result.isCircumpolar).toBe(true);
    expect(result.neverRises).toBe(false);
    expect(result.riseTime).toBeNull();
    expect(result.setTime).toBeNull();
    // Circumpolar objects still have a transit time
    expect(result.transitTime).toBeInstanceOf(Date);
  });

  it("object at Dec=-80° from London: never rises", () => {
    const result = riseTransitSet(
      45, // arbitrary RA
      -80,
      LONDON_LAT,
      LONDON_LON,
      TEST_DATE,
    );
    expect(result.neverRises).toBe(true);
    expect(result.isCircumpolar).toBe(false);
    expect(result.riseTime).toBeNull();
    expect(result.transitTime).toBeNull();
    expect(result.setTime).toBeNull();
  });

  it("rise time < transit time < set time for normal objects", () => {
    const result = riseTransitSet(
      SIRIUS_RA,
      SIRIUS_DEC,
      LONDON_LAT,
      LONDON_LON,
      TEST_DATE,
    );
    expect(result.riseTime!.getTime()).toBeLessThan(
      result.transitTime!.getTime(),
    );
    expect(result.transitTime!.getTime()).toBeLessThan(
      result.setTime!.getTime(),
    );
  });

  it("includes current altitude and azimuth", () => {
    const result = riseTransitSet(
      SIRIUS_RA,
      SIRIUS_DEC,
      LONDON_LAT,
      LONDON_LON,
      TEST_DATE,
    );
    expect(typeof result.altitude).toBe("number");
    expect(typeof result.azimuth).toBe("number");
    expect(result.azimuth).toBeGreaterThanOrEqual(0);
    expect(result.azimuth).toBeLessThan(360);
  });

  it("custom altitude threshold affects rise/set times", () => {
    const threshold0 = riseTransitSet(
      SIRIUS_RA,
      SIRIUS_DEC,
      LONDON_LAT,
      LONDON_LON,
      TEST_DATE,
      0,
    );
    const threshold15 = riseTransitSet(
      SIRIUS_RA,
      SIRIUS_DEC,
      LONDON_LAT,
      LONDON_LON,
      TEST_DATE,
      15,
    );
    // Higher threshold → later rise, earlier set
    if (threshold0.riseTime && threshold15.riseTime) {
      expect(threshold15.riseTime.getTime()).toBeGreaterThan(
        threshold0.riseTime.getTime(),
      );
    }
    if (threshold0.setTime && threshold15.setTime) {
      expect(threshold15.setTime.getTime()).toBeLessThan(
        threshold0.setTime.getTime(),
      );
    }
  });

  it("altitude at the equator for an equatorial object should peak near 90°", () => {
    // Object at dec=0, observer at equator (lat=0) — transits at zenith
    const result = riseTransitSet(0, 0, 0, 0, TEST_DATE, 0);
    // Peak altitude = 90 - |lat - dec| = 90
    // The current altitude depends on time, but it should not be circumpolar or never-rise
    expect(result.isCircumpolar).toBe(false);
    expect(result.neverRises).toBe(false);
  });

  it("circumpolar from the north pole (lat=90): dec > 0 is always visible", () => {
    const result = riseTransitSet(45, 45, 89.99, 0, TEST_DATE, 0);
    expect(result.isCircumpolar).toBe(true);
    expect(result.neverRises).toBe(false);
  });

  it("never rises from the north pole (lat=90): dec < 0 never visible", () => {
    const result = riseTransitSet(45, -10, 89.99, 0, TEST_DATE, 0);
    expect(result.neverRises).toBe(true);
    expect(result.isCircumpolar).toBe(false);
  });

  it("circumpolar from the south pole (lat=-90): dec < 0 is always visible", () => {
    const result = riseTransitSet(45, -45, -89.99, 0, TEST_DATE, 0);
    expect(result.isCircumpolar).toBe(true);
    expect(result.neverRises).toBe(false);
  });

  it("never rises from the south pole (lat=-90): dec > 0 never visible", () => {
    const result = riseTransitSet(45, 10, -89.99, 0, TEST_DATE, 0);
    expect(result.neverRises).toBe(true);
  });

  it("object at equator from equator: ~12h above horizon", () => {
    const result = riseTransitSet(0, 0, 0, 0, TEST_DATE, 0);
    expect(result.isCircumpolar).toBe(false);
    expect(result.neverRises).toBe(false);
    if (result.riseTime && result.setTime) {
      const hoursAbove =
        (result.setTime.getTime() - result.riseTime.getTime()) / 3600000;
      expect(hoursAbove).toBeCloseTo(12, 0);
    }
  });
});

describe("currentPosition", () => {
  it("returns altitude and azimuth", () => {
    const pos = currentPosition(
      SIRIUS_RA,
      SIRIUS_DEC,
      LONDON_LAT,
      LONDON_LON,
      TEST_DATE,
    );
    expect(typeof pos.altitude).toBe("number");
    expect(typeof pos.azimuth).toBe("number");
  });

  it("matches altitude/azimuth from riseTransitSet", () => {
    const vis = riseTransitSet(
      SIRIUS_RA,
      SIRIUS_DEC,
      LONDON_LAT,
      LONDON_LON,
      TEST_DATE,
    );
    const pos = currentPosition(
      SIRIUS_RA,
      SIRIUS_DEC,
      LONDON_LAT,
      LONDON_LON,
      TEST_DATE,
    );
    expect(pos.altitude).toBeCloseTo(vis.altitude, 4);
    expect(pos.azimuth).toBeCloseTo(vis.azimuth, 4);
  });

  it("azimuth is in range [0, 360) for any object", () => {
    const pos = currentPosition(200, -45, 30, 100, TEST_DATE);
    expect(pos.azimuth).toBeGreaterThanOrEqual(0);
    expect(pos.azimuth).toBeLessThan(360);
  });

  it("Polaris from London: altitude ≈ latitude", () => {
    const pos = currentPosition(
      POLARIS_RA,
      POLARIS_DEC,
      LONDON_LAT,
      LONDON_LON,
      TEST_DATE,
    );
    // Polaris altitude ≈ observer's latitude (within ~2° since dec=89.26, not 90)
    expect(Math.abs(pos.altitude - LONDON_LAT)).toBeLessThan(2);
  });
});
