"use client";

import { useState, useRef, useEffect } from "react";

type ToolEvent = { name: string; input: unknown; output: unknown };
type Message = {
  role: "user" | "assistant";
  text: string;
  tool_events?: ToolEvent[];
};

const SUGGESTIONS = [
  "Which services are owned by the money team?",
  "What is the blast radius if Auth goes down?",
  "Show me every service with a failing security check.",
  "List all tier_1 services in Ruby.",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setError(null);
    const next: Message[] = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: next.map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { reply: string; tool_events: ToolEvent[] };
      setMessages((curr) => [
        ...curr,
        { role: "assistant", text: data.reply, tool_events: data.tool_events },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-3">
        <h1 className="text-2xl font-semibold tracking-tight">Ask Claude about the catalog</h1>
        <p className="text-sm text-ink-600">
          Claude sees six tools and the catalog from <code className="text-xs font-mono">/catalog</code>.
          Tool calls and results are shown inline so you can see the wiring.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto border border-ink-200 rounded-lg bg-white p-4 space-y-4"
      >
        {messages.length === 0 && !busy && (
          <div className="text-sm text-ink-400">
            <p className="mb-3">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-xs border border-ink-200 hover:border-ink-400 rounded-md px-3 py-2 bg-ink-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div
              className={
                m.role === "user"
                  ? "bg-ink-900 text-white rounded-lg px-3 py-2 max-w-[80%] text-sm whitespace-pre-wrap"
                  : "max-w-full text-sm text-ink-900"
              }
            >
              {m.role === "assistant" && m.tool_events && m.tool_events.length > 0 && (
                <details className="mb-2 border border-ink-200 rounded-md bg-ink-50 text-xs font-mono">
                  <summary className="cursor-pointer px-3 py-1.5 text-ink-600">
                    {m.tool_events.length} tool call{m.tool_events.length === 1 ? "" : "s"}
                  </summary>
                  <div className="px-3 py-2 space-y-2">
                    {m.tool_events.map((ev, j) => (
                      <div key={j} className="border-t border-ink-200 pt-2 first:border-t-0 first:pt-0">
                        <div>
                          <span className="text-accent">→</span> {ev.name}({JSON.stringify(ev.input)})
                        </div>
                        <pre className="text-[10px] text-ink-600 whitespace-pre-wrap break-all max-h-40 overflow-auto mt-1">
                          {JSON.stringify(ev.output, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
            </div>
          </div>
        ))}

        {busy && (
          <div className="text-sm text-ink-400 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Thinking…
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 border border-red-200 rounded-md p-3 bg-red-50">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          className="flex-1 border border-ink-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-ink-400"
          placeholder="Ask about ownership, dependencies, blast radius, failing checks…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="bg-ink-900 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
