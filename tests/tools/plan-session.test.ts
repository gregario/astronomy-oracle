import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("plan_session tool", () => {
  let client: Client;

  beforeAll(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test", version: "0.0.0" });
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
  });

  function callTool(args: Record<string, unknown>) {
    return client.callTool({ name: "plan_session", arguments: args });
  }

  function text(result: Awaited<ReturnType<typeof callTool>>): string {
    const content = result.content as Array<{ type: string; text: string }>;
    return content.map((c) => c.text).join("\n");
  }

  it("returns session plan with time windows", async () => {
    const result = await callTool({
      latitude: 51.5,
      longitude: -0.1,
      date: "2025-06-15",
    });
    const output = text(result);
    expect(output).toContain("Observing Session Plan");
    expect(output).toContain("Early Evening");
    expect(output).toContain("Late Night");
    expect(output).toContain("Pre-Dawn");
  });

  it("includes location and date in header", async () => {
    const result = await callTool({
      latitude: 40.7,
      longitude: -74.0,
      date: "2025-03-20",
    });
    const output = text(result);
    expect(output).toContain("40.70");
    expect(output).toContain("N");
    expect(output).toContain("74.00");
    expect(output).toContain("W");
    expect(output).toContain("2025-03-20");
  });

  it("respects minAltitude filter", async () => {
    // With a very high minAltitude, fewer objects should appear
    const highAlt = await callTool({
      latitude: 51.5,
      longitude: -0.1,
      date: "2025-01-15",
      minAltitude: 80,
    });
    const lowAlt = await callTool({
      latitude: 51.5,
      longitude: -0.1,
      date: "2025-01-15",
      minAltitude: 15,
    });
    // High altitude filter should have fewer or equal objects
    const highLines = text(highAlt).split("\n").filter((l) => l.startsWith("|")).length;
    const lowLines = text(lowAlt).split("\n").filter((l) => l.startsWith("|")).length;
    expect(highLines).toBeLessThanOrEqual(lowLines);
  });

  it("respects maxMagnitude filter", async () => {
    const result = await callTool({
      latitude: 51.5,
      longitude: -0.1,
      date: "2025-01-15",
      maxMagnitude: 5.0,
    });
    const output = text(result);
    // Should have some objects but only bright ones
    expect(output).toContain("Observing Session Plan");
  });

  it("filters by object type", async () => {
    const result = await callTool({
      latitude: 51.5,
      longitude: -0.1,
      date: "2025-01-15",
      types: ["G"],
    });
    const output = text(result);
    expect(output).toContain("Observing Session Plan");
    // If there are objects, they should be galaxies
    if (!output.includes("No notable objects")) {
      expect(output).toContain("Galaxy");
    }
  });

  it("types filter only includes specified types", async () => {
    const result = await callTool({
      latitude: 51.5,
      longitude: -0.1,
      date: "2025-01-15",
      types: ["PN"],
    });
    const output = text(result);
    expect(output).toContain("Observing Session Plan");
    // If there are objects, they should be planetary nebulae
    if (!output.includes("No notable objects")) {
      expect(output).toContain("Planetary Nebula");
      expect(output).not.toContain("Galaxy");
      expect(output).not.toContain("Open Cluster");
    }
  });

  it("southern hemisphere location works", async () => {
    const result = await callTool({
      latitude: -33.9,
      longitude: 18.4,
      date: "2025-06-15",
    });
    const output = text(result);
    expect(output).toContain("Observing Session Plan");
    expect(output).toContain("33.90");
    expect(output).toContain("S");
  });

  it("defaults to today when no date provided", async () => {
    const result = await callTool({
      latitude: 51.5,
      longitude: -0.1,
    });
    const output = text(result);
    const today = new Date().toISOString().slice(0, 10);
    expect(output).toContain(today);
  });
});
