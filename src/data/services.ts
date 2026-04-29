// Synthetic OpsLevel-shaped service catalog. No real customer data.
// Schema mirrors the public OpsLevel GraphQL Service type at a high level:
// services with owners, tier, lifecycle, dependencies, and scorecard checks.

export type Tier = "tier_1" | "tier_2" | "tier_3" | "tier_4";
export type Lifecycle = "production" | "beta" | "alpha" | "deprecated";
export type CheckStatus = "passing" | "failing" | "pending";

export interface ScorecardCheck {
  name: string;
  category: "security" | "reliability" | "observability" | "ownership";
  status: CheckStatus;
  detail?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  owner_team: string;
  tier: Tier;
  lifecycle: Lifecycle;
  language: "Ruby" | "TypeScript" | "Go" | "Python" | "Elixir";
  on_call_email: string;
  repo: string;
  dependencies: string[]; // service ids this one calls
  scorecard: ScorecardCheck[];
}

export const services: Service[] = [
  {
    id: "svc-payments",
    name: "Payments",
    description: "Charge, refund, and reconcile transactions against Stripe and Adyen.",
    owner_team: "money",
    tier: "tier_1",
    lifecycle: "production",
    language: "Ruby",
    on_call_email: "money-oncall@example.dev",
    repo: "github.com/example/payments",
    dependencies: ["svc-auth", "svc-billing", "svc-fraud"],
    scorecard: [
      { name: "PII encryption at rest", category: "security", status: "passing" },
      { name: "Runbook present", category: "reliability", status: "passing" },
      { name: "P95 latency SLO < 250ms", category: "reliability", status: "failing", detail: "Last 7d P95 = 412ms" },
      { name: "On-call rotation defined", category: "ownership", status: "passing" },
    ],
  },
  {
    id: "svc-auth",
    name: "Auth",
    description: "OAuth2 + session issuance for first-party clients and partners.",
    owner_team: "platform",
    tier: "tier_1",
    lifecycle: "production",
    language: "Go",
    on_call_email: "platform-oncall@example.dev",
    repo: "github.com/example/auth",
    dependencies: [],
    scorecard: [
      { name: "Token rotation", category: "security", status: "passing" },
      { name: "Runbook present", category: "reliability", status: "passing" },
      { name: "Distributed tracing", category: "observability", status: "passing" },
      { name: "On-call rotation defined", category: "ownership", status: "passing" },
    ],
  },
  {
    id: "svc-notifications",
    name: "Notifications",
    description: "Email, SMS, and push fan-out with per-channel rate limits.",
    owner_team: "growth",
    tier: "tier_2",
    lifecycle: "production",
    language: "TypeScript",
    on_call_email: "growth-oncall@example.dev",
    repo: "github.com/example/notifications",
    dependencies: ["svc-auth", "svc-analytics"],
    scorecard: [
      { name: "Bounce-rate alerting", category: "observability", status: "failing", detail: "PagerDuty rule never wired" },
      { name: "Runbook present", category: "reliability", status: "passing" },
      { name: "On-call rotation defined", category: "ownership", status: "passing" },
    ],
  },
  {
    id: "svc-search",
    name: "Search",
    description: "Elasticsearch-backed full-text and semantic product search.",
    owner_team: "discovery",
    tier: "tier_2",
    lifecycle: "production",
    language: "Elixir",
    on_call_email: "discovery-oncall@example.dev",
    repo: "github.com/example/search",
    dependencies: ["svc-catalog"],
    scorecard: [
      { name: "Index rebuild dry-run < 30m", category: "reliability", status: "passing" },
      { name: "On-call rotation defined", category: "ownership", status: "passing" },
      { name: "PII redaction", category: "security", status: "passing" },
    ],
  },
  {
    id: "svc-catalog",
    name: "Catalog",
    description: "Product, SKU, and variant master data.",
    owner_team: "merchandising",
    tier: "tier_1",
    lifecycle: "production",
    language: "Ruby",
    on_call_email: "merch-oncall@example.dev",
    repo: "github.com/example/catalog",
    dependencies: ["svc-auth"],
    scorecard: [
      { name: "Backups verified weekly", category: "reliability", status: "passing" },
      { name: "Runbook present", category: "reliability", status: "failing", detail: "404 in service.yml" },
      { name: "On-call rotation defined", category: "ownership", status: "passing" },
    ],
  },
  {
    id: "svc-billing",
    name: "Billing",
    description: "Subscription state, dunning, and invoice generation.",
    owner_team: "money",
    tier: "tier_1",
    lifecycle: "production",
    language: "Ruby",
    on_call_email: "money-oncall@example.dev",
    repo: "github.com/example/billing",
    dependencies: ["svc-auth", "svc-payments"],
    scorecard: [
      { name: "Invoice idempotency tests", category: "reliability", status: "passing" },
      { name: "PII encryption at rest", category: "security", status: "passing" },
      { name: "On-call rotation defined", category: "ownership", status: "passing" },
    ],
  },
  {
    id: "svc-pricing",
    name: "Pricing",
    description: "Promo, tax, and currency-conversion pipeline.",
    owner_team: "money",
    tier: "tier_2",
    lifecycle: "production",
    language: "Python",
    on_call_email: "money-oncall@example.dev",
    repo: "github.com/example/pricing",
    dependencies: ["svc-catalog"],
    scorecard: [
      { name: "Currency table refresh < 24h", category: "reliability", status: "passing" },
      { name: "Runbook present", category: "reliability", status: "passing" },
      { name: "On-call rotation defined", category: "ownership", status: "failing", detail: "No team assigned in catalog" },
    ],
  },
  {
    id: "svc-inventory",
    name: "Inventory",
    description: "Per-warehouse stock counts and reservation locks.",
    owner_team: "fulfillment",
    tier: "tier_1",
    lifecycle: "production",
    language: "Go",
    on_call_email: "fulfillment-oncall@example.dev",
    repo: "github.com/example/inventory",
    dependencies: ["svc-catalog"],
    scorecard: [
      { name: "Lock-wait alerting", category: "observability", status: "passing" },
      { name: "Runbook present", category: "reliability", status: "passing" },
      { name: "On-call rotation defined", category: "ownership", status: "passing" },
    ],
  },
  {
    id: "svc-fulfillment",
    name: "Fulfillment",
    description: "Pick-pack-ship workflow + carrier rate shopping.",
    owner_team: "fulfillment",
    tier: "tier_2",
    lifecycle: "production",
    language: "Go",
    on_call_email: "fulfillment-oncall@example.dev",
    repo: "github.com/example/fulfillment",
    dependencies: ["svc-inventory", "svc-notifications", "svc-billing"],
    scorecard: [
      { name: "Carrier API circuit breaker", category: "reliability", status: "passing" },
      { name: "On-call rotation defined", category: "ownership", status: "passing" },
      { name: "PII redaction in logs", category: "security", status: "failing", detail: "shipping address printed at INFO" },
    ],
  },
  {
    id: "svc-analytics",
    name: "Analytics",
    description: "Event ingestion + nightly Snowflake load.",
    owner_team: "data",
    tier: "tier_3",
    lifecycle: "production",
    language: "Python",
    on_call_email: "data-oncall@example.dev",
    repo: "github.com/example/analytics",
    dependencies: [],
    scorecard: [
      { name: "DAG SLA < 4h", category: "reliability", status: "failing", detail: "Avg 5h12m last 14d" },
      { name: "On-call rotation defined", category: "ownership", status: "passing" },
    ],
  },
  {
    id: "svc-fraud",
    name: "Fraud",
    description: "Real-time risk scoring for checkout.",
    owner_team: "money",
    tier: "tier_1",
    lifecycle: "beta",
    language: "Python",
    on_call_email: "money-oncall@example.dev",
    repo: "github.com/example/fraud",
    dependencies: ["svc-auth", "svc-analytics"],
    scorecard: [
      { name: "Model drift monitor", category: "observability", status: "failing", detail: "Drift dashboard never built" },
      { name: "Runbook present", category: "reliability", status: "passing" },
      { name: "On-call rotation defined", category: "ownership", status: "passing" },
    ],
  },
];

export function getService(id: string): Service | undefined {
  return services.find((s) => s.id === id || s.name.toLowerCase() === id.toLowerCase());
}
