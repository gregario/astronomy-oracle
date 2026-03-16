/**
 * Horizontal coordinate (Alt/Az) conversion from equatorial coordinates.
 * All input/output angles in degrees.
 */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Compute hour angle from local sidereal time and right ascension.
 * All values in degrees. Result normalized to 0-360.
 */
export function hourAngle(lst: number, ra: number): number {
  return ((lst - ra) % 360 + 360) % 360;
}

/**
 * Convert hour angle, declination, and latitude to altitude and azimuth.
 * All inputs in degrees. Returns altitude and azimuth in degrees.
 *
 * Standard spherical trigonometry formulas.
 */
export function altAz(
  ha: number,
  dec: number,
  lat: number,
): { altitude: number; azimuth: number } {
  const haRad = ha * DEG_TO_RAD;
  const decRad = dec * DEG_TO_RAD;
  const latRad = lat * DEG_TO_RAD;

  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altitude = Math.asin(sinAlt) * RAD_TO_DEG;

  const cosAlt = Math.cos(altitude * DEG_TO_RAD);

  // Avoid division by zero when object is at zenith
  if (cosAlt === 0 || Math.cos(latRad) === 0) {
    return { altitude, azimuth: 0 };
  }

  let cosAz =
    (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
    (Math.cos(latRad) * cosAlt);

  // Clamp to [-1, 1] to handle floating-point errors
  cosAz = Math.max(-1, Math.min(1, cosAz));

  let azimuth = Math.acos(cosAz) * RAD_TO_DEG;

  // If hour angle indicates object is west of meridian, flip azimuth
  if (Math.sin(haRad) > 0) {
    azimuth = 360 - azimuth;
  }

  // Normalize to [0, 360)
  azimuth = ((azimuth % 360) + 360) % 360;

  return { altitude, azimuth };
}
