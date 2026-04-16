# Data

> **Source:** Marketplace (Anthropic & Partners)
> **Version:** 1.1.0
> **Author:** Anthropic
> **Verified:** Anthropic Verified
> **Tier:** 1 — Active Now
> **Skills:** 10
> **Connectors:** 8 — snowflake, databricks, bigquery, hex, amplitude, amplitude-eu, atlassian, definite
> **Install:** [Claude Cowork](https://claude.ai/redirect/claudedotcom.v1.cd205027-b086-4e65-9180-ec8b914abe62/desktop/customize/plugins/new?marketplace=anthropics/knowledge-work-plugins&plugin=data)
> **View:** [claude.com/plugins/data](https://claude.com/plugins/data)

## Description

Data transforms Claude into a data analyst collaborator. Explore datasets, write optimized SQL for any dialect, build publication-quality visualizations, and create interactive dashboards — all in one plugin.

Connect your data warehouse (Snowflake, Databricks, BigQuery, or any SQL-compatible database) and Claude will query directly, explore schemas, and iterate on analyses end-to-end. Without a connection, paste SQL results or upload CSV/Excel files for analysis.

Use `/analyze` for ad-hoc data questions, `/explore-data` to profile a dataset's shape and quality, `/write-query` for optimized SQL with best practices, `/create-viz` for Python visualizations, `/build-dashboard` for interactive HTML dashboards with filters and charts, and `/validate-data` to QA an analysis before sharing.

The plugin covers SQL best practices across dialects, statistical analysis, data profiling, and pre-delivery validation to catch issues like survivorship bias or incorrect aggregation before results go to stakeholders.

## Skills

Invoke by typing `/` in chat, or let Claude use them automatically for relevant tasks.

### `/analyze`
Answer data questions — from quick lookups to full analyses. Use when looking up a single metric, investigating what's driving a trend or drop, comparing segments over time, or preparing a formal data report for stakeholders.

### `/build-dashboard`
Build an interactive HTML dashboard with charts, filters, and tables. Use when creating an executive overview with KPI cards, turning query results into a shareable self-contained report, building a team monitoring snapshot, or needing multiple charts with filters in one browser-openable file.

### `/create-viz`
Create publication-quality visualizations with Python. Use when turning query results or a DataFrame into a chart, selecting the right chart type for a trend or comparison, generating a plot for a report or presentation, or needing an interactive chart with hover and zoom.

### `/data-context-extractor`
Generate or improve a company-specific data analysis skill by extracting tribal knowledge from analysts. BOOTSTRAP MODE — Triggers: "Create a data context skill", "Set up data analysis for our warehouse", "Help me create a skill for our database", "Generate a data skill for [company]" -> Discovers schemas, asks key questions, generates initial skill with reference files. ITERATION MODE — Triggers: "Add context about [domain]", "The skill needs more info about [topic]", "Update the data skill with [metrics/tables/terminology]", "Improve the [domain] reference" -> Loads existing skill, asks targeted questions, appends/updates reference files. Use when data analysts want Claude to understand their company's specific data warehouse, terminology, metrics definitions, and common query patterns.

### `/data-visualization`
Create effective data visualizations with Python (matplotlib, seaborn, plotly). Use when building charts, choosing the right chart type for a dataset, creating publication-quality figures, or applying design principles like accessibility and color theory.

### `/explore-data`
Profile and explore a dataset to understand its shape, quality, and patterns. Use when encountering a new table or file, checking null rates and column distributions, spotting data quality issues like duplicates or suspicious values, or deciding which dimensions and metrics to analyze.

### `/sql-queries`
Write correct, performant SQL across all major data warehouse dialects (Snowflake, BigQuery, Databricks, PostgreSQL, etc.). Use when writing queries, optimizing slow SQL, translating between dialects, or building complex analytical queries with CTEs, window functions, or aggregations.

### `/statistical-analysis`
Apply statistical methods including descriptive stats, trend analysis, outlier detection, and hypothesis testing. Use when analyzing distributions, testing for significance, detecting anomalies, computing correlations, or interpreting statistical results.

### `/validate-data`
QA an analysis before sharing — methodology, accuracy, and bias checks. Use when reviewing an analysis before a stakeholder presentation, spot-checking calculations and aggregation logic, verifying a SQL query's results look right, or assessing whether conclusions are actually supported by the data.

### `/write-query`
Write optimized SQL for your dialect with best practices. Use when translating a natural-language data need into SQL, building a multi-CTE query with joins and aggregations, optimizing a query against a large partitioned table, or getting dialect-specific syntax for Snowflake, BigQuery, Postgres, etc.

## Try Asking

- Explore and profile a dataset
- Build an interactive dashboard from my data
- Write an optimized SQL query
- Map out my data warehouse schema and tables
- Run a statistical analysis on my dataset

## Reports

See `docs/skills-reports/data/` for all generated outputs.
