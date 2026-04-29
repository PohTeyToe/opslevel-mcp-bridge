import { services } from "@/data/services";

const tierColor: Record<string, string> = {
  tier_1: "bg-red-50 text-red-700 border-red-200",
  tier_2: "bg-amber-50 text-amber-700 border-amber-200",
  tier_3: "bg-blue-50 text-blue-700 border-blue-200",
  tier_4: "bg-ink-100 text-ink-600 border-ink-200",
};

export default function CatalogPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Service catalog</h1>
      <p className="text-ink-600 mt-2 max-w-2xl text-sm">
        Synthetic data, OpsLevel-shaped. Eleven services across six teams. The chat
        page reads exactly this list through the MCP tool layer.
      </p>

      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => {
          const failing = s.scorecard.filter((c) => c.status === "failing");
          return (
            <div key={s.id} className="border border-ink-200 rounded-lg p-5 bg-white">
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold text-ink-900">{s.name}</h2>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${tierColor[s.tier]}`}>
                  {s.tier.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-ink-600 mt-2 leading-snug">{s.description}</p>

              <dl className="mt-4 grid grid-cols-2 gap-y-1 text-xs font-mono">
                <dt className="text-ink-400">owner</dt>
                <dd>{s.owner_team}</dd>
                <dt className="text-ink-400">lang</dt>
                <dd>{s.language}</dd>
                <dt className="text-ink-400">deps</dt>
                <dd>{s.dependencies.length}</dd>
                <dt className="text-ink-400">checks</dt>
                <dd>
                  {s.scorecard.length - failing.length}/{s.scorecard.length}{" "}
                  {failing.length > 0 ? (
                    <span className="text-red-600">({failing.length} failing)</span>
                  ) : (
                    <span className="text-emerald-600">(all passing)</span>
                  )}
                </dd>
              </dl>

              {failing.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-ink-200 pt-3">
                  {failing.map((c) => (
                    <li key={c.name} className="text-xs">
                      <span className="text-red-600">✕</span>{" "}
                      <span className="text-ink-800">{c.name}</span>
                      {c.detail && <span className="text-ink-400"> — {c.detail}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
