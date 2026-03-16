/**
 * Markdown formatting functions for MCP tool responses.
 */

import type {
  CelestialObject,
  VisibilityInfo,
  SessionObject,
} from "./types.js";

/**
 * Convert RA in degrees to "HHh MMm SS.Ss" format.
 * RA degrees / 15 = hours.
 */
function degreesToHMS(deg: number): string {
  const totalHours = deg / 15;
  const hours = Math.floor(totalHours);
  const remainMinutes = (totalHours - hours) * 60;
  const minutes = Math.floor(remainMinutes);
  const seconds = (remainMinutes - minutes) * 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m ${seconds.toFixed(1).padStart(4, "0")}s`;
}

/**
 * Convert Dec in degrees to "+DD° MM' SS.S\"" format.
 */
function degreesToDMS(deg: number): string {
  const sign = deg >= 0 ? "+" : "-";
  const abs = Math.abs(deg);
  const degrees = Math.floor(abs);
  const remainArcmin = (abs - degrees) * 60;
  const arcmin = Math.floor(remainArcmin);
  const arcsec = (remainArcmin - arcmin) * 60;
  return `${sign}${degrees}° ${String(arcmin).padStart(2, "0")}' ${arcsec.toFixed(1).padStart(4, "0")}"`;
}

/**
 * Format a Date as "HH:MM UTC".
 */
function formatTime(date: Date): string {
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m} UTC`;
}

/**
 * Build the display name for an object, e.g. "M31 / NGC0224 / \"Andromeda Galaxy\""
 */
function buildTitle(obj: CelestialObject): string {
  const parts: string[] = [];
  if (obj.messier) parts.push(obj.messier);
  parts.push(obj.name);
  if (obj.commonName) parts.push(`"${obj.commonName}"`);
  return parts.join(" / ");
}

/**
 * Format a single celestial object as detailed markdown.
 */
export function formatObject(
  obj: CelestialObject,
  visibility?: VisibilityInfo
): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${buildTitle(obj)}`);
  lines.push("");

  // Core properties
  lines.push(`- **Type:** ${obj.typeName}`);
  lines.push(`- **Constellation:** ${obj.constellation}`);
  lines.push(`- **RA:** ${degreesToHMS(obj.ra)}`);
  lines.push(`- **Dec:** ${degreesToDMS(obj.dec)}`);

  if (obj.magnitude !== null) {
    lines.push(`- **Magnitude:** ${obj.magnitude}`);
  }
  if (obj.surfaceBrightness !== null) {
    lines.push(`- **Surface Brightness:** ${obj.surfaceBrightness} mag/arcsec²`);
  }
  if (obj.majorAxis !== null) {
    const size =
      obj.minorAxis !== null
        ? `${obj.majorAxis}' × ${obj.minorAxis}'`
        : `${obj.majorAxis}'`;
    lines.push(`- **Angular Size:** ${size}`);
    if (obj.positionAngle !== null) {
      lines.push(`- **Position Angle:** ${obj.positionAngle}°`);
    }
  }
  if (obj.hubbleType) {
    lines.push(`- **Hubble Type:** ${obj.hubbleType}`);
  }

  // Cross-references
  const xrefs: string[] = [];
  if (obj.messier) xrefs.push(obj.messier);
  if (obj.ngcCrossRef) xrefs.push(obj.ngcCrossRef);
  if (obj.icCrossRef) xrefs.push(obj.icCrossRef);
  if (obj.otherIdentifiers) xrefs.push(obj.otherIdentifiers);
  if (xrefs.length > 0) {
    lines.push("");
    lines.push(`**Cross-references:** ${xrefs.join(", ")}`);
  }

  // Visibility section
  if (visibility) {
    lines.push("");
    lines.push("## Current Visibility");
    lines.push("");

    if (visibility.neverRises) {
      lines.push(
        "This object **never rises** above the horizon at your location."
      );
    } else if (visibility.isCircumpolar) {
      lines.push(
        "This object is **circumpolar** — it never sets at your location."
      );
      lines.push("");
      lines.push(`- **Altitude:** ${visibility.altitude.toFixed(1)}°`);
      lines.push(`- **Azimuth:** ${visibility.azimuth.toFixed(1)}°`);
      if (visibility.transitTime) {
        lines.push(`- **Transit:** ${formatTime(visibility.transitTime)}`);
      }
    } else {
      lines.push(`- **Altitude:** ${visibility.altitude.toFixed(1)}°`);
      lines.push(`- **Azimuth:** ${visibility.azimuth.toFixed(1)}°`);
      if (visibility.riseTime) {
        lines.push(`- **Rise:** ${formatTime(visibility.riseTime)}`);
      }
      if (visibility.transitTime) {
        lines.push(`- **Transit:** ${formatTime(visibility.transitTime)}`);
      }
      if (visibility.setTime) {
        lines.push(`- **Set:** ${formatTime(visibility.setTime)}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Format an array of search results as a markdown table.
 */
export function formatSearchResults(objects: CelestialObject[]): string {
  if (objects.length === 0) {
    return "No objects found.";
  }

  const lines: string[] = [];
  lines.push(`Found ${objects.length} object(s):`);
  lines.push("");
  lines.push(
    "| Name | Type | Mag | Size | Constellation | Common Name |"
  );
  lines.push(
    "| --- | --- | ---: | --- | --- | --- |"
  );

  for (const obj of objects) {
    const name = obj.messier
      ? `${obj.messier} (${obj.name})`
      : obj.name;
    const mag = obj.magnitude !== null ? String(obj.magnitude) : "—";
    const size =
      obj.majorAxis !== null
        ? obj.minorAxis !== null
          ? `${obj.majorAxis}' × ${obj.minorAxis}'`
          : `${obj.majorAxis}'`
        : "—";
    const common = obj.commonName ?? "—";

    lines.push(
      `| ${name} | ${obj.typeName} | ${mag} | ${size} | ${obj.constellation} | ${common} |`
    );
  }

  return lines.join("\n");
}

/**
 * Format a session plan with objects grouped by time window.
 */
export function formatSessionPlan(
  windows: Map<string, SessionObject[]>,
  location: { lat: number; lon: number },
  date: Date
): string {
  const lines: string[] = [];

  lines.push("# Observing Session Plan");
  lines.push("");
  lines.push(
    `**Location:** ${Math.abs(location.lat).toFixed(2)}°${location.lat >= 0 ? "N" : "S"}, ${Math.abs(location.lon).toFixed(2)}°${location.lon >= 0 ? "E" : "W"}  `
  );
  lines.push(
    `**Date:** ${date.toISOString().slice(0, 10)}`
  );

  const sections: Array<{
    key: string;
    title: string;
    timeRange: string;
  }> = [
    {
      key: "evening",
      title: "Early Evening",
      timeRange: "sunset–22:00",
    },
    {
      key: "midnight",
      title: "Late Night",
      timeRange: "22:00–02:00",
    },
    {
      key: "predawn",
      title: "Pre-Dawn",
      timeRange: "02:00–sunrise",
    },
  ];

  for (const section of sections) {
    lines.push("");
    lines.push(`## ${section.title} (${section.timeRange})`);
    lines.push("");

    const objects = windows.get(section.key);
    if (!objects || objects.length === 0) {
      lines.push("No notable objects in this window.");
      continue;
    }

    lines.push(
      "| Object | Type | Mag | Peak Alt | Transit | Score |"
    );
    lines.push(
      "| --- | --- | ---: | ---: | --- | ---: |"
    );

    for (const so of objects) {
      const name = so.object.messier
        ? `${so.object.messier} (${so.object.name})`
        : so.object.name;
      const mag =
        so.object.magnitude !== null ? String(so.object.magnitude) : "—";
      const peakAlt = `${so.peakAltitude.toFixed(1)}°`;
      const transit = formatTime(so.transitTime);

      lines.push(
        `| ${name} | ${so.object.typeName} | ${mag} | ${peakAlt} | ${transit} | ${so.score} |`
      );
    }
  }

  lines.push("");
  lines.push(
    "*Score reflects overall observability based on altitude, magnitude, and object type. Higher is better (0–100).*"
  );

  return lines.join("\n");
}
