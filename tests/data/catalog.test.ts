import { describe, it, expect, beforeAll } from "vitest";
import { loadCatalog, type CatalogStore } from "../../src/data/catalog.js";

describe("CatalogStore", () => {
  let store: CatalogStore;

  beforeAll(async () => {
    store = await loadCatalog();
  });

  it("loads more than 10000 objects", () => {
    expect(store.all.size).toBeGreaterThan(10000);
  });

  it("includes addendum objects (M45/Pleiades)", () => {
    const pleiades = store.byCommonName.get("pleiades");
    expect(pleiades).toBeDefined();
    expect(pleiades!.commonName).toBe("Pleiades");
    expect(pleiades!.messier).toBe("M45");
  });

  it("indexes by NGC name", () => {
    const m31 = store.byName.get("NGC0224");
    expect(m31).toBeDefined();
    expect(m31!.name).toBe("NGC0224");
  });

  it("indexes by Messier number", () => {
    const m31 = store.byMessier.get("M31");
    expect(m31).toBeDefined();
    expect(m31!.name).toBe("NGC0224");
    expect(m31!.messier).toBe("M31");
  });

  it("indexes by common name (case-insensitive)", () => {
    const andromeda = store.byCommonName.get("andromeda galaxy");
    expect(andromeda).toBeDefined();
    expect(andromeda!.name).toBe("NGC0224");
  });

  it("parses RA to correct degree values", () => {
    const m31 = store.byMessier.get("M31");
    expect(m31).toBeDefined();
    // 00:42:44.35 → ~10.685°
    expect(m31!.ra).toBeCloseTo(10.6848, 2);
  });

  it("parses Dec to correct degree values", () => {
    const m31 = store.byMessier.get("M31");
    expect(m31).toBeDefined();
    // +41:16:08.6 → ~41.269°
    expect(m31!.dec).toBeCloseTo(41.269, 2);
  });

  it("parses magnitude as number", () => {
    const m31 = store.byMessier.get("M31");
    expect(m31).toBeDefined();
    expect(m31!.magnitude).toBe(3.44);
  });

  it("handles null magnitudes", () => {
    // IC0001 is a double star with no V-Mag
    const ic1 = store.byName.get("IC0001");
    expect(ic1).toBeDefined();
    expect(ic1!.magnitude).toBeNull();
  });

  it("filters out NonEx and Dup objects", () => {
    for (const obj of store.all.values()) {
      expect(obj.type).not.toBe("NonEx");
      expect(obj.type).not.toBe("Dup");
    }
  });

  it("sets typeName from OBJECT_TYPES", () => {
    const m31 = store.byMessier.get("M31");
    expect(m31).toBeDefined();
    expect(m31!.typeName).toBe("Galaxy");

    const ic1 = store.byName.get("IC0001");
    expect(ic1).toBeDefined();
    expect(ic1!.typeName).toBe("Double Star");
  });

  it("parses constellation", () => {
    const m31 = store.byMessier.get("M31");
    expect(m31!.constellation).toBe("And");
  });

  it("parses hubble type", () => {
    const m31 = store.byMessier.get("M31");
    expect(m31!.hubbleType).toBe("Sb");
  });

  it("parses surface brightness", () => {
    const m31 = store.byMessier.get("M31");
    expect(m31!.surfaceBrightness).toBe(23.63);
  });

  it("parses axis dimensions", () => {
    const m31 = store.byMessier.get("M31");
    expect(m31!.majorAxis).toBe(177.83);
    expect(m31!.minorAxis).toBe(69.66);
  });

  it("parses position angle", () => {
    const m31 = store.byMessier.get("M31");
    expect(m31!.positionAngle).toBe(35);
  });

  it("stores other identifiers", () => {
    const m31 = store.byMessier.get("M31");
    expect(m31!.otherIdentifiers).toContain("UGC 00454");
  });
});
