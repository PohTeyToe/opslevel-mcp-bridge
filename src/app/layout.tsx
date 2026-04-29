import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpsLevel MCP Bridge — portfolio demo",
  description:
    "An Anthropic MCP server fronting a synthetic OpsLevel-shaped service catalog. Built by Abdallah Safi as an artifact for OpsLevel and Tidra AI applications.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-ink-200 bg-white/80 backdrop-blur sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="font-mono text-sm tracking-tight">
              <span className="text-accent">/</span>opslevel-mcp-bridge
            </Link>
            <nav className="flex gap-5 text-sm text-ink-600">
              <Link href="/catalog" className="hover:text-ink-900">Catalog</Link>
              <Link href="/chat" className="hover:text-ink-900">Chat</Link>
              <Link href="/about" className="hover:text-ink-900">About</Link>
              <a
                href="https://github.com/PohTeyToe/opslevel-mcp-bridge"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink-900"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-ink-200 mt-12">
          <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-ink-600 flex flex-wrap justify-between gap-2">
            <span>
              Built by{" "}
              <a className="underline decoration-dotted" href="https://abdallah-safi.vercel.app">
                Abdallah Safi
              </a>{" "}
              · Apr 2026 · MIT
            </span>
            <span className="font-mono">github.com/PohTeyToe/opslevel-mcp-bridge</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
