# Routing Engine

Ultra-Dex v4.0.0 introduces intelligent provider routing using multi-armed bandit algorithms.

## How It Works

The routing engine uses **Thompson Sampling** to dynamically select the best provider based on:

- **Cost** — Price per token
- **Latency** — Response time
- **Quality** — Success rate and output quality

Each provider maintains a Beta(α, β) distribution representing its success probability. The router samples from each distribution and selects the provider with the highest sample that meets your constraints.

## Usage

```bash
# Optimize for cost (picks cheapest adequate provider)
ultra-dex run planner -t "task" --optimize cost

# Optimize for latency (picks fastest provider)
ultra-dex run planner -t "task" --optimize latency

# Optimize for quality (picks highest-rated provider)
ultra-dex run planner -t "task" --optimize quality

# Explicit provider bypasses router
ultra-dex run planner -t "task" --provider claude
```

## Configuration

```bash
# Set default optimization strategy
export ROUTING_STRATEGY=cost  # or latency, quality, balanced
```

## Provider Cost Model

| Provider          | Input   | Output  | Notes        |
| ----------------- | ------- | ------- | ------------ |
| Claude (Opus)     | $15/M   | $75/M   | High quality |
| Claude (Sonnet)   | $3/M    | $15/M   | Balanced     |
| OpenAI (GPT-4o)   | $5/M    | $15/M   | Fast         |
| NVIDIA (Nemotron) | $0.60/M | $0.60/M | Cheapest     |
| Gemini            | Free    | Free    | Limited rate |

## Health Monitoring

Providers are automatically monitored for:

- **HEALTHY** — Responding normally
- **DEGRADED** — >20% error rate in last 5 minutes
- **UNHEALTHY** — >50% error rate (excluded from routing)
- **SLOW** — >3x baseline latency

UNHEALTHY providers are excluded from routing until they recover.

## Cost Savings

The BanditRouter typically achieves **30%+ cost savings** compared to always using the most expensive provider, while maintaining quality through intelligent exploration/exploitation.

## Metrics

Cost metrics are exported in Prometheus format at `/metrics`:

- `ai_cost_usd_total` — Total cost by provider
- `ai_cost_savings_usd` — Savings vs most expensive option
- `routing_decisions_total` — Routing decisions by strategy
