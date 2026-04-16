-- ============================================================================
-- Ultra-Dex SQL Query Library
-- Purpose: Optimized queries for Ultra-Dex analytics and monitoring
-- Version: 3.1.0
-- Last Updated: 2026-04-10
-- ============================================================================

-- ============================================================================
-- QUERY 1: Test Performance Analysis
-- Purpose: Analyze test execution times and identify slow tests
-- Use Case: CI/CD optimization, identifying bottlenecks
-- ============================================================================

/*
 * TEST PERFORMANCE ANALYSIS QUERY
 * 
 * This query retrieves test execution performance metrics, calculating
 * percentiles and identifying outliers that may be slowing down the CI/CD
 * pipeline. Used for weekly performance reports.
 * 
 * Expected Runtime: <50ms on indexed dataset
 * Row Estimate: 498 tests, returns ~50 rows
 */

WITH test_stats AS (
    -- Calculate basic statistics per module
    SELECT 
        module,
        COUNT(*) as total_tests,
        ROUND(AVG(duration_ms), 2) as avg_duration_ms,
        ROUND(MIN(duration_ms), 2) as min_duration_ms,
        ROUND(MAX(duration_ms), 2) as max_duration_ms,
        ROUND(STDDEV(duration_ms), 2) as stddev_duration_ms,
        -- Calculate percentiles using window functions
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as median_duration_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_duration_ms
    FROM test_executions
    WHERE executed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY module
),
slow_tests AS (
    -- Identify tests exceeding threshold
    SELECT 
        module,
        test_name,
        duration_ms,
        status,
        CASE 
            WHEN duration_ms > 5000 THEN 'CRITICAL'
            WHEN duration_ms > 1000 THEN 'WARNING'
            WHEN duration_ms > 500 THEN 'NOTICE'
            ELSE 'OK'
        END as performance_tier
    FROM test_executions
    WHERE executed_at >= CURRENT_DATE - INTERVAL '7 days'
      AND duration_ms > 500
    ORDER BY duration_ms DESC
)
SELECT 
    ts.module,
    ts.total_tests,
    ts.avg_duration_ms,
    ts.median_duration_ms,
    ts.p95_duration_ms,
    ts.p99_duration_ms,
    ts.max_duration_ms,
    COUNT(DISTINCT st.test_name) as slow_test_count,
    ROUND(100.0 * COUNT(DISTINCT st.test_name) / ts.total_tests, 2) as slow_test_pct
FROM test_stats ts
LEFT JOIN slow_tests st ON ts.module = st.module
GROUP BY 
    ts.module, ts.total_tests, ts.avg_duration_ms, ts.median_duration_ms,
    ts.p95_duration_ms, ts.p99_duration_ms, ts.max_duration_ms
ORDER BY ts.avg_duration_ms DESC;

-- ============================================================================
-- QUERY 2: Error Tracking and Analysis
-- Purpose: Track test failures, categorize errors, analyze trends
-- Use Case: Quality assurance, debugging prioritization
-- ============================================================================

/*
 * ERROR TRACKING AND ANALYSIS QUERY
 * 
 * This comprehensive query analyzes test failures, categorizing them by
 * error type, module, and time. It calculates flakiness rates and helps
 * identify the most problematic tests.
 * 
 * Expected Runtime: <100ms with proper indexing
 * Row Estimate: Returns ~100 rows (grouped by error patterns)
 */

WITH error_classification AS (
    -- Classify errors by type
    SELECT 
        te.test_id,
        te.test_name,
        te.module,
        te.error_message,
        te.stack_trace,
        te.executed_at,
        -- Error categorization using pattern matching
        CASE 
            WHEN error_message LIKE '%timeout%' OR error_message LIKE '%TimeoutError%' 
                THEN 'TIMEOUT'
            WHEN error_message LIKE '%AssertionError%' OR error_message LIKE '%assert%' 
                THEN 'ASSERTION'
            WHEN error_message LIKE '%NetworkError%' OR error_message LIKE '%ECONNREFUSED%' 
                THEN 'NETWORK'
            WHEN error_message LIKE '%MemoryError%' OR error_message LIKE '%heap%' 
                THEN 'MEMORY'
            WHEN error_message LIKE '%TypeError%' OR error_message LIKE '%ReferenceError%' 
                THEN 'RUNTIME'
            WHEN error_message LIKE '%mock%' OR error_message LIKE '%Mock%' 
                THEN 'MOCK_ERROR'
            ELSE 'UNKNOWN'
        END as error_category,
        -- Extract root cause from stack trace
        COALESCE(
            REGEXP_EXTRACT(stack_trace, 'at\s+(\w+)\s+\('),
            REGEXP_EXTRACT(stack_trace, '([^\s:]+\.js:\d+)'),
            'unknown'
        ) as error_location
    FROM test_executions te
    WHERE te.status = 'failed'
      AND te.executed_at >= CURRENT_DATE - INTERVAL '30 days'
),
flaky_tests AS (
    -- Calculate flakiness rate per test
    SELECT 
        test_name,
        module,
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as pass_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as fail_count,
        ROUND(100.0 * SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) / COUNT(*), 2) as flake_rate_pct
    FROM test_executions
    WHERE executed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY test_name, module
    HAVING COUNT(*) > 5 AND SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) > 0
)
SELECT 
    ec.error_category,
    ec.module,
    COUNT(*) as error_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as pct_of_total,
    COUNT(DISTINCT ec.test_name) as affected_tests,
    -- Most common error message per category
    MODE() WITHIN GROUP (ORDER BY ec.error_message) as most_common_error,
    -- Aggregation of affected modules
    STRING_AGG(DISTINCT ec.module, ', ') as affected_modules,
    -- Flakiness correlation
    ROUND(AVG(ft.flake_rate_pct), 2) as avg_flake_rate,
    MAX(ec.executed_at) as last_occurrence,
    -- Trend indicator (compare last 7 days vs previous 7 days)
    SUM(CASE WHEN ec.executed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as last_7_days,
    SUM(CASE WHEN ec.executed_at >= CURRENT_DATE - INTERVAL '14 days' 
              AND ec.executed_at < CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as prev_7_days
FROM error_classification ec
LEFT JOIN flaky_tests ft ON ec.test_name = ft.test_name
GROUP BY ec.error_category, ec.module
ORDER BY error_count DESC;

-- ============================================================================
-- QUERY 3: Security Audit Query
-- Purpose: Track security-related test results and vulnerability patterns
-- Use Case: Security compliance, vulnerability tracking
-- ============================================================================

/*
 * SECURITY AUDIT QUERY
 * 
 * This query analyzes security test results, tracking vulnerabilities,
 * security coverage, and compliance with security policies. Essential
 * for weekly security reviews.
 * 
 * Expected Runtime: <30ms
 * Row Estimate: ~20-30 rows
 */

WITH security_tests AS (
    -- Identify security-related tests
    SELECT 
        test_id,
        test_name,
        module,
        category,
        status,
        duration_ms,
        executed_at,
        -- Categorize by security domain
        CASE 
            WHEN test_name LIKE '%auth%' OR test_name LIKE '%Auth%' OR tags @> ARRAY['authentication']
                THEN 'Authentication'
            WHEN test_name LIKE '%governance%' OR test_name LIKE '%Governance%' OR tags @> ARRAY['governance']
                THEN 'Governance'
            WHEN test_name LIKE '%audit%' OR test_name LIKE '%Audit%' OR tags @> ARRAY['audit']
                THEN 'Audit'
            WHEN test_name LIKE '%policy%' OR test_name LIKE '%Policy%' OR tags @> ARRAY['policy']
                THEN 'Policy Enforcement'
            WHEN test_name LIKE '%crypto%' OR test_name LIKE '%encryption%' OR tags @> ARRAY['crypto']
                THEN 'Cryptography'
            WHEN test_name LIKE '%rbac%' OR test_name LIKE '%permission%' OR tags @> ARRAY['rbac']
                THEN 'Access Control'
            WHEN test_name LIKE '%rate%' OR test_name LIKE '%limit%' OR tags @> ARRAY['rate-limit']
                THEN 'Rate Limiting'
            ELSE 'General Security'
        END as security_domain
    FROM test_executions
    WHERE tags && ARRAY['security', 'governance', 'auth', 'audit', 'crypto', 'rbac']
       OR test_name ~* '(security|auth|governance|audit|policy|crypto|rbac|permission|rate.?limit)'
),
security_coverage AS (
    -- Calculate coverage by security domain
    SELECT 
        security_domain,
        COUNT(*) as total_tests,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_tests,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tests,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped_tests,
        ROUND(100.0 * SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) / COUNT(*), 2) as pass_rate,
        ROUND(AVG(duration_ms), 2) as avg_duration_ms,
        ARRAY_AGG(DISTINCT module) as covered_modules
    FROM security_tests
    WHERE executed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY security_domain
),
vulnerability_trends AS (
    -- Track vulnerability discoveries
    SELECT 
        DATE_TRUNC('week', executed_at) as week,
        security_domain,
        COUNT(*) as tests_run,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as vulnerabilities_found
    FROM security_tests
    WHERE executed_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY DATE_TRUNC('week', executed_at), security_domain
)
SELECT 
    sc.security_domain,
    sc.total_tests,
    sc.passed_tests,
    sc.failed_tests,
    sc.pass_rate,
    sc.avg_duration_ms,
    -- Severity assessment
    CASE 
        WHEN sc.pass_rate < 90 THEN 'CRITICAL'
        WHEN sc.pass_rate < 95 THEN 'WARNING'
        WHEN sc.pass_rate < 99 THEN 'NOTICE'
        ELSE 'HEALTHY'
    END as domain_health,
    -- Module coverage
    array_length(sc.covered_modules, 1) as modules_covered,
    -- Trend analysis (last 7 days vs previous 7)
    COALESCE((
        SELECT SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)
        FROM security_tests st2
        WHERE st2.security_domain = sc.security_domain
          AND st2.executed_at >= CURRENT_DATE - INTERVAL '7 days'
    ), 0) as failures_last_7d,
    -- Compliance score
    ROUND((sc.pass_rate * 0.6) + (LEAST(sc.total_tests / 10.0, 10) * 4), 1) as compliance_score
FROM security_coverage sc
ORDER BY 
    CASE sc.security_domain
        WHEN 'Authentication' THEN 1
        WHEN 'Governance' THEN 2
        WHEN 'Policy Enforcement' THEN 3
        WHEN 'Cryptography' THEN 4
        WHEN 'Access Control' THEN 5
        WHEN 'Audit' THEN 6
        WHEN 'Rate Limiting' THEN 7
        ELSE 8
    END,
    sc.pass_rate ASC;

-- ============================================================================
-- QUERY 4: Code Quality Metrics Over Time
-- Purpose: Track code quality trends, coverage, and debt
-- Use Case: Technical debt monitoring, quality gates
-- ============================================================================

/*
 * CODE QUALITY METRICS QUERY
 * 
 * This query analyzes code quality metrics over time, including coverage,
 * TypeScript errors, lint violations, and test reliability. Used for
 * sprint retrospectives and quality gates.
 * 
 * Expected Runtime: <200ms
 * Row Estimate: Returns timeline data (90 days = 90 rows)
 */

WITH daily_metrics AS (
    -- Aggregate daily quality metrics
    SELECT 
        DATE(executed_at) as date,
        module,
        COUNT(*) as tests_run,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as tests_passed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as tests_failed,
        ROUND(AVG(coverage_pct), 2) as avg_coverage,
        ROUND(AVG(duration_ms), 2) as avg_duration_ms,
        ROUND(STDDEV(duration_ms), 2) as duration_stddev,
        COUNT(DISTINCT CASE WHEN status = 'failed' THEN test_id END) as unique_failures
    FROM test_executions
    WHERE executed_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY DATE(executed_at), module
),
typescript_errors AS (
    -- Simulated TypeScript error tracking (from external source)
    SELECT 
        DATE(recorded_at) as date,
        error_count,
        warning_count
    FROM code_quality_metrics
    WHERE recorded_at >= CURRENT_DATE - INTERVAL '90 days'
),
coverage_by_module AS (
    -- Calculate coverage trends per module
    SELECT 
        module,
        ROUND(AVG(avg_coverage), 2) as current_coverage,
        MIN(avg_coverage) as min_coverage,
        MAX(avg_coverage) as max_coverage,
        ROUND(STDDEV(avg_coverage), 2) as coverage_volatility,
        -- Trend calculation (last 7 days vs first 7 days)
        ROUND(
            (SELECT AVG(avg_coverage) FROM daily_metrics WHERE module = dm.module AND date >= CURRENT_DATE - INTERVAL '7 days') -
            (SELECT AVG(avg_coverage) FROM daily_metrics WHERE module = dm.module AND date <= CURRENT_DATE - INTERVAL '83 days' AND date >= CURRENT_DATE - INTERVAL '90 days'),
            2
        ) as coverage_trend
    FROM daily_metrics dm
    GROUP BY module
),
weekly_aggregates AS (
    -- Weekly summary for trend visualization
    SELECT 
        DATE_TRUNC('week', date) as week,
        SUM(tests_run) as total_tests,
        ROUND(100.0 * SUM(tests_passed) / NULLIF(SUM(tests_run), 0), 2) as weekly_pass_rate,
        ROUND(AVG(avg_coverage), 2) as weekly_coverage,
        ROUND(AVG(avg_duration_ms), 2) as weekly_avg_duration,
        SUM(unique_failures) as weekly_failures
    FROM daily_metrics
    GROUP BY DATE_TRUNC('week', date)
)
SELECT 
    wa.week,
    wa.total_tests,
    wa.weekly_pass_rate,
    wa.weekly_coverage,
    wa.weekly_avg_duration,
    wa.weekly_failures,
    -- Quality score (0-100)
    ROUND(
        (wa.weekly_pass_rate * 0.4) +
        (wa.weekly_coverage * 0.4) +
        (GREATEST(0, 100 - (wa.weekly_avg_duration / 10)) * 0.2),
        1
    ) as quality_score,
    -- Compare to previous week
    wa.weekly_pass_rate - LAG(wa.weekly_pass_rate) OVER (ORDER BY wa.week) as pass_rate_delta,
    wa.weekly_coverage - LAG(wa.weekly_coverage) OVER (ORDER BY wa.week) as coverage_delta,
    -- Module breakdown as JSON
    (
        SELECT json_agg(json_build_object(
            'module', module,
            'coverage', current_coverage,
            'trend', coverage_trend,
            'volatility', coverage_volatility
        ))
        FROM coverage_by_module
    ) as module_breakdown
FROM weekly_aggregates wa
ORDER BY wa.week DESC;

-- ============================================================================
-- QUERY 5: Resource Utilization and Cost Analysis
-- Purpose: Analyze AI provider usage, costs, and efficiency
-- Use Case: Budget optimization, provider selection
-- ============================================================================

/*
 * RESOURCE UTILIZATION AND COST ANALYSIS QUERY
 * 
 * This query analyzes AI provider usage patterns, costs, and efficiency
 * metrics. It helps optimize provider selection and monitor budget
 * utilization across different modules and test types.
 * 
 * Expected Runtime: <150ms
 * Row Estimate: ~50 rows (grouped by provider/module)
 */

WITH provider_usage AS (
    -- Aggregate usage by provider
    SELECT 
        provider,
        module,
        test_category,
        COUNT(*) as total_calls,
        SUM(tokens_input) as total_input_tokens,
        SUM(tokens_output) as total_output_tokens,
        SUM(tokens_total) as total_tokens,
        SUM(cost_usd) as total_cost_usd,
        AVG(cost_usd) as avg_cost_per_call,
        AVG(latency_ms) as avg_latency_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency_ms,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
        SUM(CASE WHEN fallback_used THEN 1 ELSE 0 END) as fallback_count
    FROM ai_provider_calls
    WHERE executed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY provider, module, test_category
),
cost_efficiency AS (
    -- Calculate efficiency metrics
    SELECT 
        pu.*,
        -- Cost per 1K tokens
        CASE 
            WHEN pu.total_tokens > 0 THEN ROUND(1000 * pu.total_cost_usd / pu.total_tokens, 6)
            ELSE 0
        END as cost_per_1k_tokens,
        -- Tokens per dollar
        CASE 
            WHEN pu.total_cost_usd > 0 THEN ROUND(pu.total_tokens / pu.total_cost_usd, 0)
            ELSE 0
        END as tokens_per_dollar,
        -- Error rate
        ROUND(100.0 * pu.error_count / NULLIF(pu.total_calls, 0), 2) as error_rate_pct,
        -- Fallback rate
        ROUND(100.0 * pu.fallback_count / NULLIF(pu.total_calls, 0), 2) as fallback_rate_pct
    FROM provider_usage pu
),
provider_rankings AS (
    -- Rank providers by efficiency
    SELECT 
        ce.*,
        ROW_NUMBER() OVER (
            PARTITION BY ce.module, ce.test_category 
            ORDER BY ce.cost_per_1k_tokens ASC, ce.avg_latency_ms ASC
        ) as cost_efficiency_rank,
        ROW_NUMBER() OVER (
            PARTITION BY ce.module, ce.test_category 
            ORDER BY ce.avg_latency_ms ASC, ce.cost_per_1k_tokens ASC
        ) as latency_rank
    FROM cost_efficiency ce
)
SELECT 
    pr.provider,
    pr.module,
    pr.test_category,
    pr.total_calls,
    pr.total_tokens,
    ROUND(pr.total_cost_usd, 2) as total_cost_usd,
    pr.cost_per_1k_tokens,
    pr.tokens_per_dollar,
    pr.avg_latency_ms,
    pr.p95_latency_ms,
    pr.error_rate_pct,
    pr.fallback_rate_pct,
    pr.cost_efficiency_rank,
    pr.latency_rank,
    -- Composite score (lower is better)
    ROUND(
        (pr.cost_efficiency_rank * 0.4) + 
        (pr.latency_rank * 0.3) + 
        (pr.error_rate_pct * 0.2) + 
        (pr.fallback_rate_pct * 0.1),
        2
    ) as composite_score,
    -- Recommendation
    CASE 
        WHEN pr.cost_efficiency_rank = 1 AND pr.latency_rank <= 2 THEN 'RECOMMENDED'
        WHEN pr.cost_efficiency_rank <= 2 AND pr.latency_rank <= 3 THEN 'ACCEPTABLE'
        WHEN pr.error_rate_pct > 5 OR pr.fallback_rate_pct > 10 THEN 'REVIEW'
        ELSE 'ALTERNATIVE'
    END as recommendation
FROM provider_rankings pr
WHERE pr.total_calls >= 10  -- Filter out low-sample providers
ORDER BY 
    pr.module,
    pr.test_category,
    pr.composite_score ASC;

-- ============================================================================
-- INDEX RECOMMENDATIONS
-- ============================================================================

/*
 * For optimal query performance, ensure the following indexes exist:
 * 
 * CREATE INDEX idx_test_executions_date ON test_executions(executed_at);
 * CREATE INDEX idx_test_executions_module_date ON test_executions(module, executed_at);
 * CREATE INDEX idx_test_executions_status ON test_executions(status) WHERE status = 'failed';
 * CREATE INDEX idx_test_executions_tags ON test_executions USING GIN(tags);
 * CREATE INDEX idx_ai_calls_provider_date ON ai_provider_calls(provider, executed_at);
 * 
 * These indexes support the above queries efficiently.
 */

-- ============================================================================
-- MATERIALIZED VIEWS FOR DASHBOARDS
-- ============================================================================

-- Daily test summary (refresh nightly)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_test_summary AS
SELECT 
    DATE(executed_at) as date,
    COUNT(*) as total_tests,
    SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_tests,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tests,
    ROUND(AVG(coverage_pct), 2) as avg_coverage,
    ROUND(AVG(duration_ms), 2) as avg_duration_ms
FROM test_executions
WHERE executed_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(executed_at);

-- Weekly provider cost summary (refresh daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_weekly_provider_costs AS
SELECT 
    DATE_TRUNC('week', executed_at) as week,
    provider,
    COUNT(*) as total_calls,
    SUM(tokens_total) as total_tokens,
    SUM(cost_usd) as total_cost,
    AVG(latency_ms) as avg_latency_ms
FROM ai_provider_calls
WHERE executed_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', executed_at), provider;

-- ============================================================================
-- END OF QUERY LIBRARY
-- ============================================================================
