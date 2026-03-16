# Astronomy Oracle

MCP server providing accurate astronomical catalog data and deterministic observing computations.

## Stack
- TypeScript + Node.js 18+
- @modelcontextprotocol/sdk
- Vitest for testing
- Embedded OpenNGC data (CC-BY-SA 4.0)

## Commands
- `npm test` — run tests
- `npm run build` — compile TypeScript
- `npm run dev` — run with tsx
- `npm run inspect` — open MCP Inspector

## Architecture
- `src/data/` — CSV parsing, catalog store, coordinate parsing
- `src/astro/` — Deterministic astronomy math (Julian date, sidereal time, alt/az, rise/transit/set)
- `src/tools/` — MCP tool implementations (lookup-object, search-objects, plan-session)
- `src/lib/` — Shared utilities (fuzzy search)
- `src/format.ts` — Markdown formatters
- `data/` — Bundled OpenNGC CSV files

## Testing
- Tests in `tests/` mirroring src/ structure
- Astronomy math tests validate against known reference values
- Tool tests use in-memory MCP transport
