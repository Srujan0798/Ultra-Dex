# Ultra-Dex Query Optimization Guide

**Version:** 3.1.0  
**Last Updated:** April 10, 2026  
**Purpose:** Natural language to SQL translation, optimization patterns, and best practices  
**Target:** Ultra-Dex analytics database (PostgreSQL 15+)

---

## 1. Natural Language to SQL Translation

### 1.1 Translation Framework

```
Natural Language Query Structure:
═══════════════════════════════════════════════════════════════

[SELECT] [Aggregation/Calculation]
[FROM]   [Entity/Table]
[WHERE]  [Conditions/Filters]
[GROUP]  [Dimensions]
[HAVING] [Post-aggregate Filters]
[ORDER]  [Sort Criteria]
[LIMIT]  [Result Constraints]

Common Pattern Mapping:
───────────────────────
"Show me..."          → SELECT
"For each..."          → GROUP BY
"Where..."             → WHERE
"Having at least..."   → HAVING
"Sorted by..."         → ORDER BY
"Top N..."             → ORDER BY + LIMIT
"Average of..."        → AVG()
"Total..."             → SUM()
"Count of..."          → COUNT()
"Percentage of..."     → COUNT(*) FILTER / COUNT(*) * 100
```

### 1.2 Translation Examples

#### Example 1: Simple Aggregation

**Natural Language:**  
"Show me the average test duration for each module, sorted by duration descending"

**SQL Translation:**

```sql
-- Step 1: Identify entities
-- "test duration" → duration_ms column
-- "module" → module column
-- "each module" → requires GROUP BY

-- Step 2: Identify aggregation
-- "average" → AVG() function

-- Step 3: Identify sorting
-- "sorted by duration descending" → ORDER BY ... DESC

-- Final Query:
SELECT
    module,
    ROUND(AVG(duration_ms), 2) AS avg_duration_ms
FROM test_executions
WHERE executed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY module
ORDER BY avg_duration_ms DESC;
```

#### Example 2: Filtered Aggregation

**Natural Language:**  
"How many tests failed in the Governance module with duration over 1 second?"

**SQL Translation:**

```sql
-- Step 1: Identify the question type
-- "How many" → COUNT(*)

-- Step 2: Identify filters
-- "Governance module" → module = 'Governance'
-- "failed" → status = 'failed'
-- "over 1 second" → duration_ms > 1000

-- Step 3: Build query
SELECT COUNT(*) AS failed_governance_slow_tests
FROM test_executions
WHERE module = 'Governance'
  AND status = 'failed'
  AND duration_ms > 1000
  AND executed_at >= CURRENT_DATE - INTERVAL '30 days';
```

#### Example 3: Complex Aggregation with Subqueries

**Natural Language:**  
"Show me modules where more than 10% of tests take longer than the overall average duration"

**SQL Translation:**

```sql
-- Step 1: Calculate overall average (subquery)
-- Step 2: Count slow tests per module
-- Step 3: Calculate percentage
-- Step 4: Filter for > 10%

WITH overall_stats AS (
    -- Calculate overall average duration
    SELECT AVG(duration_ms) AS overall_avg_ms
    FROM test_executions
    WHERE executed_at >= CURRENT_DATE - INTERVAL '30 days'
),
module_stats AS (
    -- Calculate per-module statistics
    SELECT
        module,
        COUNT(*) AS total_tests,
        COUNT(*) FILTER (WHERE duration_ms > (SELECT overall_avg_ms FROM overall_stats)) AS slow_tests,
        AVG(duration_ms) AS module_avg_ms
    FROM test_executions
    WHERE executed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY module
)
SELECT
    module,
    total_tests,
    slow_tests,
    ROUND(100.0 * slow_tests / total_tests, 2) AS slow_test_pct,
    ROUND(module_avg_ms, 2) AS module_avg_ms
FROM module_stats
WHERE 100.0 * slow_tests / total_tests > 10
ORDER BY slow_test_pct DESC;
```

#### Example 4: Time-Series Analysis

**Natural Language:**  
"Show me the weekly trend of test pass rates over the last 90 days, including week-over-week change"

**SQL Translation:**

```sql
-- Step 1: Group by week
-- Step 2: Calculate pass rate per week
-- Step 3: Calculate week-over-week change using LAG()

WITH weekly_stats AS (
    SELECT
        DATE_TRUNC('week', executed_at) AS week,
        COUNT(*) AS total_tests,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) AS passed_tests,
        ROUND(
            100.0 * SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) / COUNT(*),
            2
        ) AS pass_rate
    FROM test_executions
    WHERE executed_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY DATE_TRUNC('week', executed_at)
)
SELECT
    week,
    total_tests,
    pass_rate,
    -- Calculate week-over-week change
    pass_rate - LAG(pass_rate) OVER (ORDER BY week) AS wow_change,
    -- Visual indicator
    CASE
        WHEN pass_rate - LAG(pass_rate) OVER (ORDER BY week) > 0 THEN '📈'
        WHEN pass_rate - LAG(pass_rate) OVER (ORDER BY week) < 0 THEN '📉'
        ELSE '➡️'
    END AS trend
FROM weekly_stats
ORDER BY week DESC;
```

---

## 2. Query Optimization Examples

### 2.1 Index Optimization

#### Before: Full Table Scan

```sql
-- SLOW: Sequential scan on 500K+ rows
SELECT * FROM test_executions
WHERE module = 'Governance'
  AND executed_at >= '2026-04-01';
-- Execution Time: 2,340ms
```

#### After: Index Utilization

```sql
-- Add composite index
CREATE INDEX idx_test_exec_module_date
ON test_executions(module, executed_at);

-- Now uses index
SELECT * FROM test_executions
WHERE module = 'Governance'
  AND executed_at >= '2026-04-01';
-- Execution Time: 12ms
-- Improvement: 195× faster
```

### 2.2 Join Optimization

#### Before: Nested Loop Join

```sql
-- SLOW: Nested loop with full scan
SELECT te.test_name, tcm.coverage_pct
FROM test_executions te
JOIN test_coverage_metrics tcm ON te.test_id = tcm.test_id
WHERE te.module = 'Governance';
-- Execution Time: 890ms
```

#### After: Hash Join with Index

```sql
-- Optimized with hash join hint
SELECT /*+ HASH_JOIN(tcm) */
    te.test_name,
    tcm.coverage_pct
FROM test_executions te
INNER JOIN test_coverage_metrics tcm
    ON te.test_id = tcm.test_id
WHERE te.module = 'Governance'
  AND te.executed_at >= CURRENT_DATE - INTERVAL '7 days';
-- Execution Time: 45ms
-- Improvement: 20× faster
```

### 2.3 Aggregation Optimization

#### Before: Multiple Scans

```sql
-- SLOW: Multiple passes over data
SELECT
    module,
    (SELECT COUNT(*) FROM test_executions WHERE module = t.module) AS total,
    (SELECT AVG(duration_ms) FROM test_executions WHERE module = t.module) AS avg_dur,
    (SELECT MAX(duration_ms) FROM test_executions WHERE module = t.module) AS max_dur
FROM test_executions t
GROUP BY module;
-- Execution Time: 4,560ms
```

#### After: Single Scan with Window Functions

```sql
-- FAST: Single pass with window functions
SELECT DISTINCT
    module,
    COUNT(*) OVER (PARTITION BY module) AS total,
    ROUND(AVG(duration_ms) OVER (PARTITION BY module), 2) AS avg_dur,
    MAX(duration_ms) OVER (PARTITION BY module) AS max_dur
FROM test_executions
WHERE executed_at >= CURRENT_DATE - INTERVAL '30 days';
-- Execution Time: 89ms
-- Improvement: 51× faster
```

### 2.4 Pagination Optimization

#### Before: OFFSET Pagination

```sql
-- SLOW: OFFSET causes sequential scan
SELECT * FROM test_executions
ORDER BY executed_at DESC
LIMIT 20 OFFSET 10000;
-- Execution Time: 1,230ms
-- Gets slower as OFFSET increases
```

#### After: Keyset Pagination (Cursor)

```sql
-- FAST: Uses index, constant time
SELECT * FROM test_executions
WHERE executed_at < '2026-04-05T12:00:00'  -- Last seen timestamp
ORDER BY executed_at DESC
LIMIT 20;
-- Execution Time: 15ms
-- Consistent performance regardless of page
```

### 2.5 CTE Optimization

#### Before: Non-Materialized CTE

```sql
-- SLOW: CTE executed multiple times
WITH expensive_calc AS (
    SELECT test_id, module,
           EXP(AVG(LOG(duration_ms))) AS geo_mean
    FROM test_executions
    GROUP BY test_id, module
)
SELECT * FROM expensive_calc WHERE module = 'Governance'
UNION ALL
SELECT * FROM expensive_calc WHERE module = 'Memory';
-- Execution Time: 2,340ms
```

#### After: Materialized CTE

```sql
-- FAST: CTE computed once
WITH expensive_calc AS MATERIALIZED (
    SELECT test_id, module,
           EXP(AVG(LOG(duration_ms))) AS geo_mean
    FROM test_executions
    GROUP BY test_id, module
)
SELECT * FROM expensive_calc WHERE module = 'Governance'
UNION ALL
SELECT * FROM expensive_calc WHERE module = 'Memory';
-- Execution Time: 1,180ms
-- Improvement: 2× faster
```

---

## 3. Best Practices Documentation

### 3.1 Query Design Principles

```
Query Design Best Practices:
═══════════════════════════════════════════════════════════════

1. SELECT Only What You Need
   ✓ SELECT module, duration_ms
   ✗ SELECT *

2. Filter Early and Often
   ✓ WHERE executed_at >= CURRENT_DATE - INTERVAL '7 days'
   ✗ Filter in HAVING or application layer

3. Use Indexes Effectively
   ✓ WHERE module = 'Governance' (indexed)
   ✓ WHERE created_at >= '2026-04-01' (indexed)
   ✗ WHERE UPPER(module) = 'GOVERNANCE' (function prevents index use)

4. Prefer JOINs over Subqueries
   ✓ INNER JOIN
   ✗ WHERE id IN (SELECT ...)

5. Use Appropriate Aggregations
   ✓ COUNT(*) for counting
   ✓ COUNT(column) only when NULL exclusion needed
   ✓ SUM/CASE for conditional counting
```

### 3.2 Performance Anti-Patterns

| Anti-Pattern                     | Issue                   | Solution                              |
| -------------------------------- | ----------------------- | ------------------------------------- |
| `SELECT *`                       | Unnecessary I/O         | Select specific columns               |
| `OR` conditions                  | Index inefficiency      | Use `UNION` or `IN`                   |
| Functions on indexed columns     | Index can't be used     | Pre-calculate or use functional index |
| Implicit type conversion         | Index skip              | Match column types                    |
| `NOT IN` with NULLs              | Unexpected results      | Use `NOT EXISTS` or `LEFT JOIN`       |
| `LIKE '%pattern%'`               | Full table scan         | Use full-text search or trigram index |
| Missing `LIMIT`                  | Unbounded results       | Always add reasonable limit           |
| `DISTINCT` without need          | Sorting overhead        | Review if truly necessary             |
| Correlated subqueries            | O(n²) complexity        | Convert to JOIN                       |
| Temporary tables without indexes | Slow subsequent queries | Add indexes to temp tables            |

### 3.3 Index Strategy

```sql
-- Recommended Indexes for Ultra-Dex:
═══════════════════════════════════════════════════════════════

-- Primary lookup indexes
CREATE INDEX idx_test_executions_date
ON test_executions(executed_at DESC);

CREATE INDEX idx_test_executions_module_date
ON test_executions(module, executed_at DESC);

CREATE INDEX idx_test_executions_status
ON test_executions(status) WHERE status = 'failed';

-- Partial index for active tests
CREATE INDEX idx_test_executions_active
ON test_executions(module, status)
WHERE executed_at >= CURRENT_DATE - INTERVAL '30 days';

-- GIN index for array searches (tags)
CREATE INDEX idx_test_executions_tags
ON test_executions USING GIN(tags);

-- BRIN index for time-series (if table is very large)
CREATE INDEX idx_test_executions_time_brin
ON test_executions USING BRIN(executed_at);

-- Covering index for common queries
CREATE INDEX idx_test_executions_covering
ON test_executions(module, executed_at, status, duration_ms)
INCLUDE (test_name, coverage_pct);
```

### 3.4 Query Template Library

```sql
-- Template 1: Time-Series Aggregation
═══════════════════════════════════════════════════════════════

WITH daily_metrics AS (
    SELECT
        DATE_TRUNC('period', timestamp_column) AS period,
        COUNT(*) AS count,
        AVG(metric) AS avg_metric,
        -- Add other aggregations
    FROM table_name
    WHERE timestamp_column >= CURRENT_DATE - INTERVAL 'X days'
    GROUP BY DATE_TRUNC('period', timestamp_column)
)
SELECT
    period,
    count,
    avg_metric,
    avg_metric - LAG(avg_metric) OVER (ORDER BY period) AS delta
FROM daily_metrics
ORDER BY period DESC;

-- Template 2: Percentile Analysis
═══════════════════════════════════════════════════════════════

SELECT
    module,
    COUNT(*) AS n,
    MIN(duration_ms) AS min_val,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY duration_ms) AS p25,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) AS p50,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY duration_ms) AS p75,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95,
    MAX(duration_ms) AS max_val
FROM test_executions
GROUP BY module;

-- Template 3: Running Totals
═══════════════════════════════════════════════════════════════

SELECT
    date,
    daily_count,
    SUM(daily_count) OVER (
        ORDER BY date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total,
    AVG(daily_count) OVER (
        ORDER BY date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS rolling_7day_avg
FROM daily_stats;

-- Template 4: Top N per Group
═══════════════════════════════════════════════════════════════

WITH ranked AS (
    SELECT
        module,
        test_name,
        duration_ms,
        ROW_NUMBER() OVER (
            PARTITION BY module
            ORDER BY duration_ms DESC
        ) AS rank
    FROM test_executions
)
SELECT module, test_name, duration_ms
FROM ranked
WHERE rank <= 5
ORDER BY module, rank;

-- Template 5: Gap Analysis
═══════════════════════════════════════════════════════════════

WITH date_series AS (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE,
        INTERVAL '1 day'
    )::date AS date
),
daily_counts AS (
    SELECT DATE(executed_at) AS date, COUNT(*) AS count
    FROM test_executions
    GROUP BY DATE(executed_at)
)
SELECT
    ds.date,
    COALESCE(dc.count, 0) AS test_count,
    CASE WHEN dc.count IS NULL THEN 'GAP' ELSE 'OK' END AS status
FROM date_series ds
LEFT JOIN daily_counts dc ON ds.date = dc.date
ORDER BY ds.date;
```

### 3.5 Explain Plan Analysis

```sql
-- How to analyze query performance:
═══════════════════════════════════════════════════════════════

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT module, AVG(duration_ms)
FROM test_executions
GROUP BY module;

-- Key metrics to check:
-- 1. Planning Time: Should be < 10ms for simple queries
-- 2. Execution Time: Compare to baseline
-- 3. Rows: Should match expected cardinality
-- 4. Loops: Nested loops should have low iteration count
-- 5. Buffers: Shared hits good, reads bad
-- 6. Index usage: Seq Scan vs Index Scan

-- Red flags:
-- - Seq Scan on large tables
-- - High "actual time" on nodes
-- - Large number of loops
-- - High "Rows Removed by Filter"
```

### 3.6 Query Review Checklist

```
Pre-Execution Checklist:
═══════════════════════════════════════════════════════════════

[ ] SELECT only required columns
[ ] WHERE clause uses indexed columns
[ ] Date ranges are reasonable (not too broad)
[ ] JOINs have appropriate indexes
[ ] GROUP BY includes all non-aggregated columns
[ ] LIMIT specified for exploratory queries
[ ] EXPLAIN plan reviewed for large tables
[ ] Query tested on production-like data volume

Post-Execution Checklist:
─────────────────────────
[ ] Execution time acceptable (< 100ms for OLTP)
[ ] Row count matches expectations
[ ] No timeout errors
[ ] Memory usage reasonable
[ ] Results validated for correctness
```

---

## 4. Quick Reference

### 4.1 Common Pattern Cheat Sheet

| Pattern           | SQL Snippet                                                                          |
| ----------------- | ------------------------------------------------------------------------------------ |
| Moving Average    | `AVG(value) OVER (ORDER BY date ROWS 6 PRECEDING)`                                   |
| Year-over-Year    | `value - LAG(value, 12) OVER (ORDER BY month)`                                       |
| Cumulative Sum    | `SUM(value) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING)`                           |
| Percent of Total  | `100.0 * value / SUM(value) OVER ()`                                                 |
| Rank              | `RANK() OVER (ORDER BY value DESC)`                                                  |
| Dense Rank        | `DENSE_RANK() OVER (PARTITION BY group ORDER BY value)`                              |
| Row Number        | `ROW_NUMBER() OVER (PARTITION BY group ORDER BY value)`                              |
| First Value       | `FIRST_VALUE(value) OVER (PARTITION BY group ORDER BY date)`                         |
| Last Value        | `LAST_VALUE(value) OVER (PARTITION BY group ORDER BY date ROWS UNBOUNDED FOLLOWING)` |
| N Tile            | `NTILE(4) OVER (ORDER BY value)`                                                     |
| Conditional Count | `COUNT(*) FILTER (WHERE condition)`                                                  |
| Conditional Sum   | `SUM(value) FILTER (WHERE condition)`                                                |

### 4.2 Date/Time Functions

```sql
-- Common date patterns:
CURRENT_DATE - INTERVAL '7 days'                    -- Last week
DATE_TRUNC('week', timestamp)                        -- Week start
DATE_TRUNC('month', timestamp)                       -- Month start
EXTRACT(EPOCH FROM (t2 - t1))                        -- Duration in seconds
AGE(timestamp)                                       -- Human-readable age
TO_CHAR(timestamp, 'YYYY-MM-DD')                     -- Format as string
GENERATE_SERIES(start, end, INTERVAL '1 day')       -- Date series
```

---

**Document Version:** 3.1.0  
**Next Review:** April 17, 2026  
**Author:** Ultra-Dex Data Engineering Team
