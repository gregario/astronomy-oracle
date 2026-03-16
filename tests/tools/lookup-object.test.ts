import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

describe("lookup_object tool", () => {
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
    return client.callTool({ name: "lookup_object", arguments: args });
  }

  function text(result: Awaited<ReturnType<typeof callTool>>): string {
    const content = result.content as Array<{ type: string; text: string }>;
    return content.map((c) => c.text).join("\n");
  }

  it("looks up M31 by Messier number", async () => {
    const result = await callTool({ name: "M31" });
    const output = text(result);
    expect(output).toContain("Andromeda Galaxy");
    expect(output).toContain("NGC0224");
  });

  it("looks up by common name 'Orion Nebula'", async () => {
    const result = await callTool({ name: "Orion Nebula" });
    const output = text(result);
    expect(output).toContain("M42");
  });

  it("looks up by NGC number NGC7000", async () => {
    const result = await callTool({ name: "NGC7000" });
    const output = text(result);
    expect(output).toContain("North America");
  });

  it("returns error for unknown object", async () => {
    const result = await callTool({ name: "ZZZNOTREAL999" });
    const output = text(result);
    expect(output).toContain("No object found");
  });

  it("looks up by common name 'Pleiades' (addendum object)", async () => {
    const result = await callTool({ name: "Pleiades" });
    const output = text(result);
    expect(output).toContain("M45");
    expect(output).toContain("Pleiades");
  });

  it("looks up M42 by Messier number", async () => {
    const result = await callTool({ name: "M42" });
    const output = text(result);
    expect(output).toContain("Orion Nebula");
    expect(output).toContain("NGC1976");
  });

  it("includes visibility when lat/lon/date provided", async () => {
    const result = await callTool({
      name: "M31",
      latitude: 51.5,
      longitude: -0.1,
      date: "2025-01-15T22:00:00Z",
    });
    const output = text(result);
    expect(output).toContain("Visibility");
    expect(output).toContain("Altitude");
  });
});
