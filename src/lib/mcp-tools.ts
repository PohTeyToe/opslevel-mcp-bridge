// Server-side MCP-shaped tool registry. Each tool here is also exposed as a
// real MCP tool over stdio in `scripts/mcp-server.mjs` for Claude Desktop users
// — the web `/api/chat` route runs the same logic in-process.

import { services, getService, type Service } from "@/data/services";

export const toolDefinitions = [
  {
    name: "list_services",
    description:
      "List every service in the catalog with name, owner team, tier, and lifecycle. Use this for broad questions like 'what services do we have?' or 'show me all tier_1 services'.",
    input_schema: {
      type: "object" as const,
      properties: {
        tier: { type: "string", enum: ["tier_1", "tier_2", "tier_3", "tier_4"], description: "Optional tier filter." },
        owner_team: { type: "string", description: "Optional team filter." },
      },
    },
  },
  {
    name: "get_service",
    description:
      "Get full details for a single service: description, owner, tier, dependencies, on-call email, scorecard checks.",
    input_schema: {
      type: "object" as const,
      properties: {
        id_or_name: { type: "string", description: "Service id (e.g. svc-payments) or display name (e.g. Payments)." },
      },
      required: ["id_or_name"],
    },
  },
  {
    name: "find_services_by_owner",
    description: "Return every service owned by a given team.",
    input_schema: {
      type: "object" as const,
      properties: {
        owner_team: { type: "string", description: "Team name, e.g. 'money', 'platform', 'growth'." },
      },
      required: ["owner_team"],
    },
  },
  {
    name: "find_services_failing_check",
    description:
      "Return services with at least one failing scorecard check, optionally filtered by category (security, reliability, observability, ownership).",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          enum: ["security", "reliability", "observability", "ownership"],
          description: "Optional check category filter.",
        },
      },
    },
  },
  {
    name: "get_dependencies",
    description: "Return the direct dependencies of a service (services it calls).",
    input_schema: {
      type: "object" as const,
      properties: {
        id_or_name: { type: "string" },
      },
      required: ["id_or_name"],
    },
  },
  {
    name: "compute_blast_radius",
    description:
      "Compute the transitive blast radius for a service: every service that would be affected (directly or transitively) if this service went down. Returns the upstream dependent set.",
    input_schema: {
      type: "object" as const,
      properties: {
        id_or_name: { type: "string", description: "The service whose outage we're modeling." },
      },
      required: ["id_or_name"],
    },
  },
];

type ToolInput = Record<string, unknown>;

export function executeTool(name: string, input: ToolInput): unknown {
  switch (name) {
    case "list_services": {
      const tier = input.tier as string | undefined;
      const owner = input.owner_team as string | undefined;
      return services
        .filter((s) => (!tier || s.tier === tier) && (!owner || s.owner_team === owner))
        .map(({ id, name, owner_team, tier, lifecycle, language }) => ({
          id,
          name,
          owner_team,
          tier,
          lifecycle,
          language,
        }));
    }
    case "get_service": {
      const svc = getService(String(input.id_or_name));
      return svc ?? { error: `Service not found: ${input.id_or_name}` };
    }
    case "find_services_by_owner": {
      const owner = String(input.owner_team).toLowerCase();
      return services
        .filter((s) => s.owner_team.toLowerCase() === owner)
        .map(summarize);
    }
    case "find_services_failing_check": {
      const cat = input.category as string | undefined;
      return services
        .filter((s) =>
          s.scorecard.some((c) => c.status === "failing" && (!cat || c.category === cat))
        )
        .map((s) => ({
          ...summarize(s),
          failing_checks: s.scorecard.filter(
            (c) => c.status === "failing" && (!cat || c.category === cat)
          ),
        }));
    }
    case "get_dependencies": {
      const svc = getService(String(input.id_or_name));
      if (!svc) return { error: `Service not found: ${input.id_or_name}` };
      return {
        service: svc.name,
        dependencies: svc.dependencies.map((id) => {
          const dep = getService(id);
          return dep ? { id: dep.id, name: dep.name, owner_team: dep.owner_team, tier: dep.tier } : { id };
        }),
      };
    }
    case "compute_blast_radius": {
      const svc = getService(String(input.id_or_name));
      if (!svc) return { error: `Service not found: ${input.id_or_name}` };
      const affected = new Set<string>();
      const queue = [svc.id];
      while (queue.length) {
        const current = queue.shift()!;
        for (const candidate of services) {
          if (candidate.dependencies.includes(current) && !affected.has(candidate.id)) {
            affected.add(candidate.id);
            queue.push(candidate.id);
          }
        }
      }
      const out = [...affected].map((id) => {
        const s = getService(id)!;
        return { id: s.id, name: s.name, owner_team: s.owner_team, tier: s.tier };
      });
      return {
        service: svc.name,
        direct_and_transitive_consumers: out,
        impacted_count: out.length,
        worst_tier: out.reduce<string>((acc, s) => (s.tier < acc ? s.tier : acc), "tier_4"),
      };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function summarize(s: Service) {
  return {
    id: s.id,
    name: s.name,
    owner_team: s.owner_team,
    tier: s.tier,
    lifecycle: s.lifecycle,
  };
}
