---
name: build-dashboard
description: Design or review a data dashboard. Use when creating a product, marketing, or operations dashboard; choosing metrics and visualizations; or critiquing an existing dashboard for clarity and actionability.
argument-hint: "[audience or topic] dashboard"
---

# /build-dashboard

> If you see unfamiliar placeholders or need to check which tools are connected, see [CONNECTORS.md](../../CONNECTORS.md).

Design or review a data dashboard.

## Usage

```
/build-dashboard $ARGUMENTS
```

## What I Need From You

- **Audience**: Who will use this dashboard? (executives, product team, ops)
- **Purpose**: What decisions should it support?
- **Data sources**: What systems feed this dashboard?
- **Refresh cadence**: Real-time, hourly, daily, or weekly?

## Dashboard Design Principles

1. **Start with the question** — What decision does this dashboard support?
2. **Hierarchy of information** — Most important metrics should be most prominent
3. **Context over numbers** — Always show comparison (previous period, target, benchmark)
4. **Fewer metrics, more insight** — 5-10 focused metrics beat 50 unfocused ones
5. **Visual status indicators** — Green/yellow/red or up/down arrows for quick scanning
6. **Actionability** — Every metric should be something the viewer can influence

## Common Dashboard Types

- **Executive summary**: High-level KPIs, trends, and alerts
- **Product health**: Engagement, retention, activation, and quality metrics
- **Growth/marketing**: Funnel, conversion, CAC, and LTV metrics
- **Operations**: Uptime, throughput, errors, and support metrics
- **Financial**: Revenue, costs, margins, and cash flow

## Output

```markdown
## Dashboard Design: [Name]

### Purpose
[What decisions this supports and who it's for]

### Top-Line Metrics
| Metric | Visualization | Comparison | Alert Threshold |
|--------|--------------|------------|-----------------|
| [Metric 1] | Big number | vs last week | [Threshold] |
| [Metric 2] | Sparkline | vs target | [Threshold] |

### Secondary Metrics
| Metric | Visualization | Drill-Down |
|--------|--------------|------------|
| [Metric] | Line chart | By segment, by region |

### Layout
[Description of the dashboard layout — top row, middle row, filters]

### Data Sources
| Source | Table/Report | Refresh |
|--------|-------------|---------|
| [Source] | [Table] | [Cadence] |

### Alerts
| Condition | Severity | Owner |
|-----------|----------|-------|
| [Condition] | 🔴 / 🟡 | [Role] |
```

## If Connectors Available

If **data warehouse** is connected:

- Design SQL-based metrics and dimensions
- Validate that the data exists and is queryable

If **product analytics** is connected:

- Map event-based metrics to dashboard visualizations
- Set up funnel and cohort charts

If **spreadsheet** is connected:

- Prototype the dashboard in a spreadsheet first
- Validate metric definitions and calculations

## Tips

1. **One dashboard per audience** — Executives and analysts need very different views.
2. **Drill-down, don't clutter** — Put details one click away, not on the main view.
3. **Name everything clearly** — "MAU" is fine if everyone knows it. Otherwise, spell it out.
4. **Review dashboards regularly** — Unused metrics are dashboard debt.
