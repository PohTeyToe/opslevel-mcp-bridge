import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { toolDefinitions, executeTool } from "@/lib/mcp-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You are an internal-developer-portal copilot wired to a service catalog
through MCP-shaped tools. The catalog is small (about a dozen services) and synthetic.

Rules:
- Always answer using tool results, never guess service names or owners.
- Prefer concise answers. When listing services, use a short markdown table or bullet list.
- For "blast radius" questions, call compute_blast_radius and explain the result in one short paragraph plus a list.
- If a service can't be found, say so plainly and suggest list_services.
- Never invent scorecard checks that the tools didn't return.
- Cite the tool you used in parens, e.g. "(via compute_blast_radius)".`;

type HistoryItem = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server. Set it in Vercel env and redeploy." },
      { status: 500 }
    );
  }

  const body = (await req.json()) as { history: HistoryItem[] };
  const history = body.history ?? [];

  const client = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = history.map((h) => ({
    role: h.role,
    content: h.content,
  }));

  const tool_events: { name: string; input: unknown; output: unknown }[] = [];

  // Tool-use loop. Cap at 6 iterations to avoid runaway.
  for (let i = 0; i < 6; i++) {
    const resp = await client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      system: SYSTEM,
      tools: toolDefinitions,
      messages,
    });

    if (resp.stop_reason === "tool_use") {
      const toolUses = resp.content.filter((b) => b.type === "tool_use");
      // assistant turn (preserve full content array including any text)
      messages.push({ role: "assistant", content: resp.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUses) {
        if (block.type !== "tool_use") continue;
        const out = executeTool(block.name, (block.input ?? {}) as Record<string, unknown>);
        tool_events.push({ name: block.name, input: block.input, output: out });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(out),
        });
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Final answer.
    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n")
      .trim();

    return NextResponse.json({ reply: text || "(no text)", tool_events });
  }

  return NextResponse.json({
    reply: "Hit the tool-use iteration cap before reaching a final answer.",
    tool_events,
  });
}
