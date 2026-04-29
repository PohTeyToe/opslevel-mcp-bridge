// Demo Mode: deterministic intent router over the 6 catalog tools.
//
// Why: Vercel serverless can't shell to the `claude` CLI, the only available
// credential is a Claude Code OAuth token (CC_OAUTH_TOKEN), and the raw
// Anthropic Messages API rejects OAuth with
// "401 OAuth authentication is currently not supported". Rather than wire a
// self-hosted backend just to demo a small synthetic catalog, the route
// pattern-matches the user's question, calls the real tools in src/lib/mcp-tools,
// and synthesizes a reply from real tool output. The chat UI is unchanged --
// `tool_events` still drive the inline tool-call viewer.
//
// If a real ANTHROPIC_API_KEY is set, you can re-introduce the LLM path by
// reverting this file from git history.

import { NextResponse } from "next/server";
import { executeTool } from "@/lib/mcp-tools";
import { services } from "@/data/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HistoryItem = { role: "user" | "assistant"; content: string };
type ToolEvent = { name: string; input: unknown; output: unknown };

const DEMO_BANNER =
  "_Demo mode: deterministic intent router over the 6 catalog tools. Live LLM is disabled to avoid an API key dependency. Tool calls and results below are real._\n\n";

function call(events: ToolEvent[], name: string, input: Record<string, unknown>): unknown {
  const output = executeTool(name, input);
  events.push({ name, input, output });
  return output;
}

function findServiceMention(q: string): string | null {
  const lower = q.toLowerCase();
  // Prefer longer names first to avoid "auth" matching inside other words.
  const sorted = [...services].sort((a, b) => b.name.length - a.name.length);
  for (const s of sorted) {
    const n = s.name.toLowerCase();
    const idShort = s.id.replace(/^svc-/, "");
    const re = new RegExp(`\\b(${n}|${s.id}|${idShort})\\b`, "i");
    if (re.test(lower)) return s.id;
  }
  return null;
}

function findOwnerMention(q: string): string | null {
  const lower = q.toLowerCase();
  const owners = [...new Set(services.map((s) => s.owner_team.toLowerCase()))];
  for (const o of owners) if (new RegExp(`\\b${o}\\b`, "i").test(lower)) return o;
  return null;
}

function findTierMention(q: string): string | null {
  const m = q.toLowerCase().match(/tier[_\s-]?([1-4])/);
  return m ? `tier_${m[1]}` : null;
}

function findCategoryMention(q: string): string | null {
  const cats = ["security", "reliability", "observability", "ownership"];
  const lower = q.toLowerCase();
  for (const c of cats) if (lower.includes(c)) return c;
  return null;
}

function findLanguageMention(q: string): string | null {
  const langs = ["Ruby", "TypeScript", "Go", "Python", "Elixir"];
  for (const l of langs) if (new RegExp(`\\b${l}\\b`, "i").test(q)) return l;
  return null;
}

function summarizeServiceList(items: { name: string; owner_team: string; tier: string; lifecycle?: string }[]): string {
  if (items.length === 0) return "_No services match._";
  const rows = items.map((s) => `- **${s.name}** — ${s.owner_team} · ${s.tier}${s.lifecycle ? ` · ${s.lifecycle}` : ""}`);
  return rows.join("\n");
}

function answer(q: string, events: ToolEvent[]): string {
  const lower = q.toLowerCase();
  const serviceId = findServiceMention(q);
  const owner = findOwnerMention(q);
  const tier = findTierMention(q);
  const category = findCategoryMention(q);
  const language = findLanguageMention(q);

  // Blast radius
  if (/blast radius|goes? down|outage|impact|affected/.test(lower) && serviceId) {
    const out = call(events, "compute_blast_radius", { id_or_name: serviceId }) as {
      service: string;
      direct_and_transitive_consumers: { name: string; owner_team: string; tier: string }[];
      impacted_count: number;
      worst_tier: string;
    };
    if (out.impacted_count === 0) {
      return `**${out.service}** has no upstream consumers in the catalog — nothing else would break if it went down. _(via compute_blast_radius)_`;
    }
    const list = out.direct_and_transitive_consumers
      .map((s) => `- **${s.name}** (${s.owner_team}, ${s.tier})`)
      .join("\n");
    return `If **${out.service}** went down, **${out.impacted_count}** service(s) would be impacted (worst tier: ${out.worst_tier}):\n\n${list}\n\n_(via compute_blast_radius)_`;
  }

  // Dependencies of a service
  if (/depend|calls?|relies on|upstream of/.test(lower) && serviceId) {
    const out = call(events, "get_dependencies", { id_or_name: serviceId }) as {
      service: string;
      dependencies: { name?: string; owner_team?: string; tier?: string; id: string }[];
    };
    if (out.dependencies.length === 0) {
      return `**${out.service}** has no declared dependencies. _(via get_dependencies)_`;
    }
    const list = out.dependencies
      .map((d) => `- **${d.name ?? d.id}**${d.owner_team ? ` — ${d.owner_team}, ${d.tier}` : ""}`)
      .join("\n");
    return `**${out.service}** depends on:\n\n${list}\n\n_(via get_dependencies)_`;
  }

  // Failing checks
  if (/fail|broken|red|violation|noncompliant|non-compliant/.test(lower)) {
    const input = category ? { category } : {};
    const out = call(events, "find_services_failing_check", input) as {
      name: string;
      owner_team: string;
      tier: string;
      failing_checks: { name: string; category: string; detail?: string }[];
    }[];
    if (out.length === 0) {
      return `No services have failing${category ? ` ${category}` : ""} checks. _(via find_services_failing_check)_`;
    }
    const blocks = out.map((s) => {
      const checks = s.failing_checks
        .map((c) => `  - ${c.name} _(${c.category})_${c.detail ? ` — ${c.detail}` : ""}`)
        .join("\n");
      return `- **${s.name}** (${s.owner_team}, ${s.tier})\n${checks}`;
    });
    return `Services with failing${category ? ` ${category}` : ""} checks:\n\n${blocks.join("\n\n")}\n\n_(via find_services_failing_check)_`;
  }

  // Owned by team
  if ((/own|team/.test(lower) || owner) && owner) {
    const out = call(events, "find_services_by_owner", { owner_team: owner }) as {
      name: string;
      owner_team: string;
      tier: string;
      lifecycle: string;
    }[];
    return `Services owned by **${owner}**:\n\n${summarizeServiceList(out)}\n\n_(via find_services_by_owner)_`;
  }

  // Single service detail
  if (serviceId && /(detail|info|tell me about|describe|what is|who owns|on[- ]call|runbook|repo)/.test(lower)) {
    const svc = call(events, "get_service", { id_or_name: serviceId }) as {
      name: string;
      description: string;
      owner_team: string;
      tier: string;
      lifecycle: string;
      language: string;
      on_call_email: string;
      repo: string;
      dependencies: string[];
      scorecard: { name: string; status: string; category: string }[];
    };
    const failing = svc.scorecard.filter((c) => c.status === "failing");
    const failBlock =
      failing.length > 0
        ? `\n\nFailing checks: ${failing.map((c) => `${c.name} (${c.category})`).join(", ")}`
        : "\n\nAll scorecard checks passing.";
    return `**${svc.name}** — ${svc.description}\n\n- Owner: ${svc.owner_team}\n- Tier: ${svc.tier} · ${svc.lifecycle} · ${svc.language}\n- On-call: ${svc.on_call_email}\n- Repo: ${svc.repo}\n- Dependencies: ${svc.dependencies.length ? svc.dependencies.join(", ") : "none"}${failBlock}\n\n_(via get_service)_`;
  }

  // List with optional tier/owner/language filter
  if (/list|show|all|every|which|what services/.test(lower) || tier || language) {
    const input: Record<string, unknown> = {};
    if (tier) input.tier = tier;
    if (owner) input.owner_team = owner;
    let out = call(events, "list_services", input) as {
      name: string;
      owner_team: string;
      tier: string;
      lifecycle: string;
      language: string;
    }[];
    if (language) out = out.filter((s) => s.language.toLowerCase() === language.toLowerCase());
    const filterDesc = [tier, owner, language].filter(Boolean).join(" · ") || "catalog";
    return `Services (${filterDesc}):\n\n${summarizeServiceList(out)}\n\n_(via list_services${language ? " + language filter" : ""})_`;
  }

  // Fallback: list everything
  const out = call(events, "list_services", {}) as {
    name: string;
    owner_team: string;
    tier: string;
    lifecycle: string;
  }[];
  return `I'm running in deterministic demo mode and didn't recognize a specific intent. Here is the full catalog so you can see what to ask about:\n\n${summarizeServiceList(out)}\n\nTry: "blast radius if Auth goes down", "services owned by money", "every service with a failing security check", "list tier_1 services in Ruby". _(via list_services)_`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { history: HistoryItem[] };
  const history = body.history ?? [];
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json({ reply: DEMO_BANNER + "Ask me about the catalog.", tool_events: [] });
  }

  const events: ToolEvent[] = [];
  let reply: string;
  try {
    reply = answer(lastUser.content, events);
  } catch (e) {
    reply = `Error answering question: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({ reply: DEMO_BANNER + reply, tool_events: events });
}
