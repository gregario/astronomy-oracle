/**
 * Coordinate parsing utilities for sexagesimal RA/Dec strings.
 */

/**
 * Parse a right ascension string "HH:MM:SS.SS" to degrees.
 * RA hours are multiplied by 15 to convert to degrees.
 */
export function parseRA(ra: string): number | null {
  if (!ra || typeof ra !== "string") return null;
  const parts = ra.split(":");
  if (parts.length !== 3) return null;

  const hours = parseFloat(parts[0]);
  const minutes = parseFloat(parts[1]);
  const seconds = parseFloat(parts[2]);

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;

  return (hours + minutes / 60 + seconds / 3600) * 15;
}

/**
 * Parse a declination string "±DD:MM:SS.SS" to degrees.
 */
export function parseDec(dec: string): number | null {
  if (!dec || typeof dec !== "string") return null;

  const sign = dec.startsWith("-") ? -1 : 1;
  const stripped = dec.replace(/^[+-]/, "");
  const parts = stripped.split(":");
  if (parts.length !== 3) return null;

  const degrees = parseFloat(parts[0]);
  const minutes = parseFloat(parts[1]);
  const seconds = parseFloat(parts[2]);

  if (isNaN(degrees) || isNaN(minutes) || isNaN(seconds)) return null;

  return sign * (degrees + minutes / 60 + seconds / 3600);
}
