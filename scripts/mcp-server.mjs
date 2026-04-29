#!/usr/bin/env node
// Minimal stdio MCP server exposing the same six tools as the web app.
// Speaks the JSON-RPC 2.0 framing used by the MCP spec, so any MCP-aware
// client (Claude Desktop, the @modelcontextprotocol inspector) can consume it.
//
// Tools are intentionally a subset of the Anthropic SDK shape, transformed
// into MCP shape (name, description, inputSchema). The runtime logic is the
// same as src/lib/mcp-tools.ts — kept separate so this script has zero deps.
//
// Run: node scripts/mcp-server.mjs (or wire it as an MCP server in your client)

import readline from "node:readline";

// ---- Catalog (mirrors src/data/services.ts) -----------------------------
const services = [
  // Truncated copy — for the canonical record see src/data/services.ts.
  // This server is a convenience for MCP-Desktop users; the live demo at
  // /chat uses the TS module directly.
  { id: "svc-payments", name: "Payments", owner_team: "money", tier: "tier_1", lifecycle: "production", language: "Ruby", dependencies: ["svc-auth", "svc-billing", "svc-fraud"] },
  { id: "svc-auth", name: "Auth", owner_team: "platform", tier: "tier_1", lifecycle: "production", language: "Go", dependencies: [] },
  { id: "svc-notifications", name: "Notifications", owner_team: "growth", tier: "tier_2", lifecycle: "production", language: "TypeScript", dependencies: ["svc-auth", "svc-analytics"] },
  { id: "svc-search", name: "Search", owner_team: "discovery", tier: "tier_2", lifecycle: "production", language: "Elixir", dependencies: ["svc-catalog"] },
  { id: "svc-catalog", name: "Catalog", owner_team: "merchandising", tier: "tier_1", lifecycle: "production", language: "Ruby", dependencies: ["svc-auth"] },
  { id: "svc-billing", name: "Billing", owner_team: "money", tier: "tier_1", lifecycle: "production", language: "Ruby", dependencies: ["svc-auth", "svc-payments"] },
  { id: "svc-pricing", name: "Pricing", owner_team: "money", tier: "tier_2", lifecycle: "production", language: "Python", dependencies: ["svc-catalog"] },
  { id: "svc-inventory", name: "Inventory", owner_team: "fulfillment", tier: "tier_1", lifecycle: "production", language: "Go", dependencies: ["svc-catalog"] },
  { id: "svc-fulfillment", name: "Fulfillment", owner_team: "fulfillment", tier: "tier_2", lifecycle: "production", language: "Go", dependencies: ["svc-inventory", "svc-notifications", "svc-billing"] },
  { id: "svc-analytics", name: "Analytics", owner_team: "data", tier: "tier_3", lifecycle: "production", language: "Python", dependencies: [] },
  { id: "svc-fraud", name: "Fraud", owner_team: "money", tier: "tier_1", lifecycle: "beta", language: "Python", dependencies: ["svc-auth", "svc-analytics"] },
];

const find = (q) => services.find((s) => s.id === q || s.name.toLowerCase() === String(q).toLowerCase());

const tools = [
  { name: "list_services", description: "List services, optionally filtered by tier or owner_team.", inputSchema: { type: "object", properties: { tier: { type: "string" }, owner_team: { type: "string" } } } },
  { name: "get_service", description: "Get a service by id or name.", inputSchema: { type: "object", properties: { id_or_name: { type: "string" } }, required: ["id_or_name"] } },
  { name: "find_services_by_owner", description: "Services owned by a team.", inputSchema: { type: "object", properties: { owner_team: { type: "string" } }, required: ["owner_team"] } },
  { name: "get_dependencies", description: "Direct dependencies of a service.", inputSchema: { type: "object", properties: { id_or_name: { type: "string" } }, required: ["id_or_name"] } },
  { name: "compute_blast_radius", description: "Transitive consumers (blast radius) of a service.", inputSchema: { type: "object", properties: { id_or_name: { type: "string" } }, required: ["id_or_name"] } },
];

function run(name, args = {}) {
  switch (name) {
    case "list_services":
      return services.filter((s) => (!args.tier || s.tier === args.tier) && (!args.owner_team || s.owner_team === args.owner_team));
    case "get_service":
      return find(args.id_or_name) ?? { error: "not found" };
    case "find_services_by_owner":
      return services.filter((s) => s.owner_team.toLowerCase() === String(args.owner_team).toLowerCase());
    case "get_dependencies": {
      const s = find(args.id_or_name);
      if (!s) return { error: "not found" };
      return { service: s.name, dependencies: s.dependencies.map((id) => find(id)).filter(Boolean) };
    }
    case "compute_blast_radius": {
      const s = find(args.id_or_name);
      if (!s) return { error: "not found" };
      const out = new Set(); const queue = [s.id];
      while (queue.length) {
        const c = queue.shift();
        for (const cand of services) {
          if (cand.dependencies.includes(c) && !out.has(cand.id)) { out.add(cand.id); queue.push(cand.id); }
        }
      }
      return { service: s.name, impacted: [...out].map(find), count: out.size };
    }
    default:
      return { error: `unknown tool ${name}` };
  }
}

// ---- JSON-RPC framing ---------------------------------------------------
const rl = readline.createInterface({ input: process.stdin });
const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");

rl.on("line", (line) => {
  let req;
  try { req = JSON.parse(line); } catch { return; }
  const { id, method, params } = req;
  if (method === "initialize") {
    send({ jsonrpc: "2.0", id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "opslevel-mcp-bridge", version: "0.1.0" } } });
  } else if (method === "tools/list") {
    send({ jsonrpc: "2.0", id, result: { tools } });
  } else if (method === "tools/call") {
    const result = run(params?.name, params?.arguments ?? {});
    send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result) }] } });
  } else if (method === "notifications/initialized") {
    // no-op
  } else {
    send({ jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${method}` } });
  }
});

process.stderr.write("opslevel-mcp-bridge stdio server ready\n");
