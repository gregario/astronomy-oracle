import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("search_objects tool", () => {
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
    return client.callTool({ name: "search_objects", arguments: args });
  }

  function text(result: Awaited<ReturnType<typeof callTool>>): string {
    const content = result.content as Array<{ type: string; text: string }>;
    return content.map((c) => c.text).join("\n");
  }

  it("searches by constellation", async () => {
    const result = await callTool({ constellation: "Ori" });
    const output = text(result);
    expect(output).toContain("Ori");
    expect(output).toContain("Found");
  });

  it("searches by type PN (Planetary Nebula)", async () => {
    const result = await callTool({ type: "PN" });
    const output = text(result);
    expect(output).toContain("Planetary Nebula");
  });

  it("filters by maxMagnitude", async () => {
    const result = await callTool({ maxMagnitude: 4.0 });
    const output = text(result);
    // Should only have bright objects — all magnitudes ≤ 4.0
    expect(output).toContain("Found");
    // Should not have faint objects
    expect(output).not.toContain("No objects found");
  });

  it("filters by catalog messier", async () => {
    const result = await callTool({ catalog: "messier" });
    const output = text(result);
    expect(output).toContain("M");
  });

  it("respects limit parameter", async () => {
    const result = await callTool({ limit: 3 });
    const output = text(result);
    expect(output).toContain("Found 3 object(s)");
  });

  it("combines filters with AND logic", async () => {
    const result = await callTool({
      type: "G",
      constellation: "And",
      maxMagnitude: 12,
    });
    const output = text(result);
    expect(output).toContain("Galaxy");
    expect(output).toContain("And");
  });

  it("filters by minSize", async () => {
    const result = await callTool({ minSize: 100 });
    const output = text(result);
    expect(output).toContain("Found");
    // Should only have large objects
    expect(output).not.toContain("No objects found");
  });

  it("filters by minMagnitude (brightest cutoff)", async () => {
    const result = await callTool({ minMagnitude: 8.0, maxMagnitude: 9.0, limit: 5 });
    const output = text(result);
    expect(output).toContain("Found");
  });

  it("returns no results message for impossible filter", async () => {
    const result = await callTool({
      constellation: "ZZZFAKE",
    });
    const output = text(result);
    expect(output).toContain("No objects found");
  });
});
