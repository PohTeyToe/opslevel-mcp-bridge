import Link from "next/link";

export default function Home() {
  return (
    <div>
      <section className="grid-bg border-b border-ink-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="font-mono text-xs text-accent tracking-wide uppercase mb-4">
            Portfolio artifact · OpsLevel + Tidra AI
          </p>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
            A working MCP bridge over a service catalog.
          </h1>
          <p className="mt-6 text-lg text-ink-600 max-w-2xl">
            Ten synthetic services with owners, tiers, dependencies, and scorecard checks.
            Claude reads the catalog through six MCP-shaped tools and answers questions
            like &ldquo;which services are owned by money and have a failing security check?&rdquo;
            or &ldquo;what&rsquo;s the blast radius if Auth goes down?&rdquo;
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/chat"
              className="bg-ink-900 text-white px-5 py-3 rounded-md text-sm font-medium hover:bg-ink-800 transition"
            >
              Open the chat →
            </Link>
            <Link
              href="/catalog"
              className="border border-ink-200 px-5 py-3 rounded-md text-sm font-medium hover:border-ink-400 transition"
            >
              Browse the catalog
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">The thesis</h2>
            <p className="mt-3 text-ink-600 leading-relaxed">
              On the Request/Response podcast (Apr 2025), then-OpsLevel CTO Ken Rose argued
              that <em>internal API visibility plus an LLM</em> is where IDPs unlock
              5x–10x developer-experience gains, and named Anthropic MCP as the wire
              protocol that gets us there. This demo is the smallest end-to-end version
              of that bet I could ship in an afternoon.
            </p>
            <p className="mt-3 text-ink-600 leading-relaxed">
              Ken left to co-found Tidra AI in March 2026 — agentic systems for
              repo-wide maintenance work — so the same artifact doubles as a cold
              outreach to the new company. The thesis travelled with him.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight">What&rsquo;s exposed</h2>
            <ul className="mt-3 space-y-2 font-mono text-sm">
              <li><span className="text-accent">tool</span> list_services <span className="text-ink-400">— filter by tier, team</span></li>
              <li><span className="text-accent">tool</span> get_service <span className="text-ink-400">— full record incl. scorecard</span></li>
              <li><span className="text-accent">tool</span> find_services_by_owner</li>
              <li><span className="text-accent">tool</span> find_services_failing_check <span className="text-ink-400">— by category</span></li>
              <li><span className="text-accent">tool</span> get_dependencies</li>
              <li><span className="text-accent">tool</span> compute_blast_radius <span className="text-ink-400">— transitive consumers</span></li>
            </ul>
            <p className="mt-4 text-sm text-ink-600">
              Same logic backs the in-process <code className="font-mono text-xs bg-ink-100 px-1 rounded">/api/chat</code> tool-use loop and a stdio MCP
              server in <code className="font-mono text-xs bg-ink-100 px-1 rounded">scripts/mcp-server.mjs</code> for Claude Desktop.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-ink-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-xl font-semibold tracking-tight mb-4">Try these prompts</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              "Which services are owned by the money team?",
              "What is the blast radius if Auth goes down?",
              "Show me every service with a failing security check.",
              "What does Fulfillment depend on, and which of those have on-call rotations?",
              "List all tier_1 production services in Ruby.",
              "Which team has the most services in the catalog, and how many are failing checks?",
            ].map((p) => (
              <div key={p} className="border border-ink-200 rounded-md p-4 text-sm text-ink-800 bg-ink-50">
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
