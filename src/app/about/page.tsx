export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 prose prose-sm">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <p className="text-ink-600 mt-4 leading-relaxed">
        I&rsquo;m Abdallah Safi, a Software Engineering co-op student at McMaster
        University (Sept 2021 → Apr 2027). I built this demo as the artifact
        attached to my OpsLevel SWE co-op application and as a cold-outreach
        artifact for Tidra AI, the agentic-AI dev-tooling spinoff Ken Rose and
        John Laban founded after leaving OpsLevel in March 2026.
      </p>
      <h2 className="text-xl font-semibold mt-8">Why this exists</h2>
      <p className="text-ink-600 leading-relaxed">
        Ken&rsquo;s Request/Response podcast episode &ldquo;Anthropic MCP, GraphQL
        vs REST, and API strategies for LLM dev tools&rdquo; (Apr 2025) is the
        clearest public articulation I&rsquo;ve found of the &ldquo;LLM + service
        catalog = 5–10x DX&rdquo; thesis. This is the smallest possible reference
        implementation: ten realistic services, six tools, one chat surface,
        deployed end-to-end.
      </p>
      <h2 className="text-xl font-semibold mt-8">What&rsquo;s under the hood</h2>
      <ul className="mt-3 text-ink-600 space-y-1">
        <li>Next.js 14 (App Router) + Tailwind. No DB — synthetic catalog as a TypeScript module.</li>
        <li>
          Six tools defined in <code>src/lib/mcp-tools.ts</code>; same registry powers both the
          web tool-use loop and the stdio MCP server in <code>scripts/mcp-server.mjs</code>.
        </li>
        <li>
          <code>/api/chat</code> uses the Anthropic SDK with tool definitions; tool calls are executed
          server-side against the synthetic catalog and folded back into the response.
        </li>
        <li>Vercel deploy. Public repo, MIT.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8">Honest disclaimers</h2>
      <ul className="mt-3 text-ink-600 space-y-1">
        <li>The catalog is synthetic. No OpsLevel customer or production data.</li>
        <li>The schema is shaped after OpsLevel&rsquo;s public GraphQL types but is not a faithful import.</li>
        <li>Six tools is the minimum to demo the pattern. A real bridge would add scorecard mutations, lifecycle changes, and write-path safety rails.</li>
      </ul>
      <p className="mt-8 text-ink-600">
        Source:{" "}
        <a className="underline" href="https://github.com/PohTeyToe/opslevel-mcp-bridge">
          github.com/PohTeyToe/opslevel-mcp-bridge
        </a>
      </p>
    </div>
  );
}
