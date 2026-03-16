/**
 * Julian Date and Sidereal Time calculations.
 * Based on Jean Meeus, "Astronomical Algorithms".
 */

/**
 * Convert a calendar date/time to Julian Date.
 * Standard Meeus algorithm (ch. 7).
 */
export function julianDate(date: Date): number {
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1; // JS months are 0-based
  const d =
    date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400 +
    date.getUTCMilliseconds() / 86400000;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);

  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    d +
    B -
    1524.5
  );
}

/**
 * Greenwich Mean Sidereal Time in degrees (0-360).
 * Meeus ch. 12 formula.
 */
export function greenwichMeanSiderealTime(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;

  // Normalize to 0-360
  gmst = ((gmst % 360) + 360) % 360;
  return gmst;
}

/**
 * Local Sidereal Time in degrees (0-360).
 * LST = GMST + longitude.
 */
export function localSiderealTime(date: Date, longitude: number): number {
  const jd = julianDate(date);
  const gmst = greenwichMeanSiderealTime(jd);
  const lst = ((gmst + longitude) % 360 + 360) % 360;
  return lst;
}
