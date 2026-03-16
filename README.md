<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://www.npmjs.com/package/astronomy-oracle"><img src="https://img.shields.io/npm/v/astronomy-oracle.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/astronomy-oracle"><img src="https://img.shields.io/npm/dm/astronomy-oracle.svg" alt="npm downloads"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-18%2B-brightgreen.svg" alt="Node.js 18+"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-compatible-purple.svg" alt="MCP Compatible"></a>
  <a href="https://github.com/sponsors/gregario"><img src="https://img.shields.io/badge/sponsor-%E2%99%A5-ea4aaa.svg" alt="Sponsor"></a>
</p>

# Astronomy Oracle

Accurate astronomical catalog data and observing session planner for LLM assistants. Stops hallucinated magnitudes, coordinates, and visibility.

## Features

- **3 tools** for object lookup, catalog search, and observing session planning
- **13,000+ deep-sky objects** from the OpenNGC catalog (NGC, IC, Messier, and addendum objects)
- **Deterministic astronomy math** — Julian dates, sidereal time, alt/az conversion, rise/transit/set times
- **Zero network dependency** — all data is bundled, all calculations are local

## Install

Run directly with npx:

```bash
npx astronomy-oracle
```

Or install globally:

```bash
npm install -g astronomy-oracle
```

## Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "astronomy-oracle": {
      "command": "npx",
      "args": ["-y", "astronomy-oracle"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add astronomy-oracle -- npx -y astronomy-oracle
```

## Tool Reference

### `lookup_object`

Look up a celestial object by Messier number, NGC/IC designation, or common name. Optionally compute visibility from a given location and time.

```json
{
  "name": "lookup_object",
  "arguments": {
    "name": "M31",
    "latitude": 51.5,
    "longitude": -0.1,
    "date": "2025-06-15T22:00:00Z"
  }
}
```

Returns detailed object data: type, coordinates (RA/Dec), magnitude, angular size, surface brightness, Hubble type, cross-references, and (when location is provided) current altitude/azimuth with rise/transit/set times.

### `search_objects`

Search and filter the catalog by type, constellation, magnitude range, angular size, or catalog membership.

```json
{
  "name": "search_objects",
  "arguments": {
    "type": "PN",
    "constellation": "Lyr",
    "maxMagnitude": 12.0,
    "limit": 10
  }
}
```

Returns a formatted table of matching objects sorted by brightness. Supports filtering by object type (Galaxy, Planetary Nebula, Open Cluster, etc.), constellation, magnitude range, minimum angular size, and catalog (Messier, Caldwell, NGC, IC).

### `plan_session`

Generate an observing session plan for a given location and date. Returns the best objects to observe grouped by time window.

```json
{
  "name": "plan_session",
  "arguments": {
    "latitude": 40.7,
    "longitude": -74.0,
    "date": "2025-03-20",
    "minAltitude": 20,
    "maxMagnitude": 10.0,
    "types": ["G", "PN", "GCl"]
  }
}
```

Returns objects grouped into three windows (evening, midnight, pre-dawn), scored by observability based on altitude, magnitude, and angular size.

## Data Sources

| Source | License | Description |
| --- | --- | --- |
| [OpenNGC](https://github.com/mattiaverga/OpenNGC) | CC-BY-SA 4.0 | NGC/IC/Messier catalog with coordinates, magnitudes, dimensions, and cross-references |

The OpenNGC data is included under the Creative Commons Attribution-ShareAlike 4.0 International License. See the [OpenNGC repository](https://github.com/mattiaverga/OpenNGC) for full attribution.

## Development

```bash
# Run tests
npm test

# Build
npm run build

# Run in development mode (tsx)
npm run dev

# Open MCP Inspector
npm run inspect
```

## License

MIT for code. CC-BY-SA 4.0 for OpenNGC data.
