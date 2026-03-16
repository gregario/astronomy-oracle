/**
 * Rise, transit, and set time calculations for celestial objects.
 * All angles in degrees unless noted otherwise.
 */

import type { VisibilityInfo } from "../types.js";
import {
  julianDate,
  greenwichMeanSiderealTime,
  localSiderealTime,
} from "./time.js";
import { hourAngle, altAz } from "./coordinates.js";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Compute rise, transit, and set times for a celestial object.
 *
 * @param ra - Right ascension in degrees
 * @param dec - Declination in degrees
 * @param lat - Observer latitude in degrees (positive north)
 * @param lon - Observer longitude in degrees (positive east)
 * @param date - Date/time for the calculation
 * @param altitudeThreshold - Minimum altitude in degrees (default 0)
 * @returns VisibilityInfo with rise/transit/set times and current position
 */
export function riseTransitSet(
  ra: number,
  dec: number,
  lat: number,
  lon: number,
  date: Date,
  altitudeThreshold: number = 0,
): VisibilityInfo {
  const decRad = dec * DEG_TO_RAD;
  const latRad = lat * DEG_TO_RAD;
  const thresholdRad = altitudeThreshold * DEG_TO_RAD;

  // Current position
  const pos = currentPosition(ra, dec, lat, lon, date);

  // Compute cosH0: the hour angle at rise/set
  const cosH0 =
    (Math.sin(thresholdRad) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  // Circumpolar: always above threshold
  if (cosH0 < -1) {
    // Still compute transit time for circumpolar objects
    const transitTime = computeTransitTime(ra, lon, date);
    return {
      altitude: pos.altitude,
      azimuth: pos.azimuth,
      riseTime: null,
      transitTime,
      setTime: null,
      isCircumpolar: true,
      neverRises: false,
    };
  }

  // Never rises above threshold
  if (cosH0 > 1) {
    return {
      altitude: pos.altitude,
      azimuth: pos.azimuth,
      riseTime: null,
      transitTime: null,
      setTime: null,
      isCircumpolar: false,
      neverRises: true,
    };
  }

  // Normal case: compute semi-diurnal arc
  const H0 = Math.acos(cosH0) * RAD_TO_DEG; // in degrees

  // Transit time: when LST = RA
  const transitTime = computeTransitTime(ra, lon, date);

  // Rise = transit - H0/360 days, Set = transit + H0/360 days
  const arcDaysMs = (H0 / 360) * 86400000; // H0 in degrees → fraction of day → ms
  // Sidereal day is ~23h56m, so scale by sidereal/solar ratio
  const siderealRatio = 0.99726958;
  const arcMs = arcDaysMs * siderealRatio;

  const riseTime = new Date(transitTime.getTime() - arcMs);
  const setTime = new Date(transitTime.getTime() + arcMs);

  return {
    altitude: pos.altitude,
    azimuth: pos.azimuth,
    riseTime,
    transitTime,
    setTime,
    isCircumpolar: false,
    neverRises: false,
  };
}

/**
 * Compute the current altitude and azimuth of a celestial object.
 */
export function currentPosition(
  ra: number,
  dec: number,
  lat: number,
  lon: number,
  date: Date,
): { altitude: number; azimuth: number } {
  const lst = localSiderealTime(date, lon);
  const ha = hourAngle(lst, ra);
  return altAz(ha, dec, lat);
}

/**
 * Compute the UTC time when an object transits (LST = RA) on the
 * sidereal day containing the given date.
 *
 * Strategy: find the GMST at transit (GMST = RA - lon), then solve
 * for the JD when GMST has that value, and convert to a Date near
 * the given date.
 */
function computeTransitTime(
  ra: number,
  lon: number,
  date: Date,
): Date {
  // We need the time when LST = RA, i.e., GMST = RA - lon
  const targetGMST = ((ra - lon) % 360 + 360) % 360;

  // Get GMST at the start of the UTC day
  const dayStart = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
  const jd0 = julianDate(dayStart);
  const gmst0 = greenwichMeanSiderealTime(jd0);

  // GMST advances ~360.985647° per solar day, so find hours until target
  // Difference in GMST degrees needed
  let dgmst = ((targetGMST - gmst0) % 360 + 360) % 360;

  // Convert sidereal degrees to solar hours: 360.985647°/24h solar
  // hours = dgmst / 360.985647 * 24
  const solarHours = (dgmst / 360.98564736629) * 24;

  const transitMs = dayStart.getTime() + solarHours * 3600000;

  // Ensure the transit is within ~12 hours of the given date
  let transit = new Date(transitMs);
  const diffMs = transit.getTime() - date.getTime();

  // If transit is more than 12h in the future, go back one sidereal day
  if (diffMs > 12 * 3600000) {
    transit = new Date(transit.getTime() - 86164091); // sidereal day in ms
  }
  // If transit is more than 12h in the past, go forward one sidereal day
  if (diffMs < -12 * 3600000) {
    transit = new Date(transit.getTime() + 86164091);
  }

  return transit;
}
