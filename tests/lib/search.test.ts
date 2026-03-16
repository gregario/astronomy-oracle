import { describe, it, expect } from "vitest";
import { fuzzySearch } from "../../src/lib/search.js";

interface TestItem {
  name: string;
  alias: string | null;
  code: string | null;
}

const items: TestItem[] = [
  { name: "Andromeda Galaxy", alias: "M31", code: "NGC0224" },
  { name: "Orion Nebula", alias: "M42", code: "NGC1976" },
  { name: "Pleiades", alias: "M45", code: null },
  { name: "Crab Nebula", alias: "M1", code: "NGC1952" },
  { name: "Ring Nebula", alias: null, code: "NGC6720" },
];

describe("fuzzySearch", () => {
  it("matches by substring", () => {
    const results = fuzzySearch(items, "andromeda", ["name", "alias"]);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Andromeda Galaxy");
  });

  it("is case-insensitive", () => {
    const results = fuzzySearch(items, "ORION", ["name"]);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Orion Nebula");
  });

  it("matches across multiple fields", () => {
    const results = fuzzySearch(items, "M42", ["name", "alias", "code"]);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Orion Nebula");
  });

  it("handles null fields without error", () => {
    const results = fuzzySearch(items, "NGC", ["name", "alias", "code"]);
    // Ring Nebula has null alias, Pleiades has null code — should not crash
    expect(results.length).toBeGreaterThan(0);
    // All results with NGC in code
    for (const r of results) {
      const hasMatch =
        r.name.toLowerCase().includes("ngc") ||
        (r.alias?.toLowerCase().includes("ngc") ?? false) ||
        (r.code?.toLowerCase().includes("ngc") ?? false);
      expect(hasMatch).toBe(true);
    }
  });

  it("returns empty array for no match", () => {
    const results = fuzzySearch(items, "zzzzz", ["name", "alias", "code"]);
    expect(results).toHaveLength(0);
  });

  it("returns all items for empty query", () => {
    const results = fuzzySearch(items, "", ["name"]);
    expect(results).toHaveLength(items.length);
  });

  it("matches partial substrings", () => {
    const results = fuzzySearch(items, "nebula", ["name"]);
    expect(results).toHaveLength(3); // Orion, Crab, Ring
  });
});
