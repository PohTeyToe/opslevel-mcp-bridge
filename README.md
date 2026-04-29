# OpsLevel MCP Bridge

A working artifact built for two job applications: **OpsLevel** (Software Engineering Co-op, Apr 2026) and **Tidra AI** (cold outreach to Ken Rose and John Laban after their March 2026 spinoff).

Live demo: https://opslevel-mcp-bridge.vercel.app

## What it is

A Next.js 14 app that serves three things from one synthetic OpsLevel-shaped service catalog:

1. **`/catalog`** — a visual view of eleven realistic services with owners, tiers, dependencies, and scorecard checks.
2. **`/chat`** — a Claude chat that answers natural-language questions about the catalog by calling six MCP-shaped tools server-side.
3. **`scripts/mcp-server.mjs`** — a stdio MCP server exposing the same five core tools to any MCP client (Claude Desktop, the MCP inspector).

## Why it exists

On the *Request/Response* podcast (Apr 2025, "Anthropic MCP, GraphQL vs REST, and API strategies for LLM dev tools"), then-OpsLevel CTO Ken Rose argued that internal-API visibility plus an LLM is where IDPs unlock 5–10x developer-experience gains, and named Anthropic MCP as the wire protocol. This repo is the smallest end-to-end version of that bet I could ship in an afternoon.

Ken left to co-found Tidra AI in March 2026 — agentic systems for repo-wide maintenance work. The thesis travelled with him, so the same artifact doubles as a Tidra cold-outreach piece.

## Tools exposed

| Tool | Returns |
|-|-|
| `list_services` | All services, filterable by tier and owner team |
| `get_service` | Full record for one service incl. scorecard |
| `find_services_by_owner` | Services owned by a given team |
| `find_services_failing_check` | Services with one or more failing checks, optionally by category |
| `get_dependencies` | Direct dependencies of a service |
| `compute_blast_radius` | Transitive upstream consumers (impact set) |

The web app and the stdio MCP server share the same logic; the catalog is in `src/data/services.ts`.

## Local dev

```sh
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

Visit http://localhost:3000.

## Stack

- Next.js 14 App Router, TypeScript, Tailwind
- `@anthropic-ai/sdk` for the chat tool-use loop
- Vercel for deploy

## Disclaimers

- Catalog is synthetic. No OpsLevel customer or production data.
- Schema is *shaped after* OpsLevel's public GraphQL types but is not a faithful import.
- Six tools is the minimum to demo the pattern; a real bridge would add scorecard mutations and write-path safety rails.

## License

MIT. Built by Abdallah Safi — github.com/PohTeyToe — Apr 2026.
