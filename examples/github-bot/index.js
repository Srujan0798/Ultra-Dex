// Copyright (c) 2026 Ultra-Dex
// Example: GitHub Bot — Automated PR Review + Issue Triage

/**
 * A GitHub automation bot that:
 *   1. Reviews PRs for bugs, style, and security
 *   2. Triages issues with label suggestions
 *   3. Uses Agent Templates for consistent behavior
 *   4. Logs everything through Governance audit trail
 *
 * Usage:  node examples/github-bot/index.js
 */

import { TemplateRegistry } from '../../src/core/templates/agent-templates.js';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { TraceCollector } from '../../src/core/observability/trace-collector.js';

// ── Setup ───────────────────────────────────────────────────────────────

const templates = new TemplateRegistry();
templates.loadBuiltIns();

const governance = new GovernanceManager();
const tracer = new TraceCollector();

// Instantiate code reviewer from template
const reviewerConfig = templates.instantiate('code-reviewer', {
    config: { maxTokensPerReview: 2000, autoComment: false },
});

// ── PR Review ───────────────────────────────────────────────────────────

async function reviewPullRequest(pr) {
    const traceId = tracer.startTrace({ agentId: 'github-bot', task: `pr-review-${pr.number}` });
    const spanId = tracer.startSpan({ traceId, operation: 'review' });

    // Gate through governance
    const gate = await governance.gate({
        agentId: 'github-bot',
        action: 'review-pr',
        resource: `PR #${pr.number}`,
    });

    if (!gate.allowed) {
        tracer.failSpan(traceId, spanId, new Error(`Blocked: ${gate.reason}`));
        tracer.failTrace(traceId, new Error(gate.reason));
        return { blocked: true, reason: gate.reason };
    }

    tracer.addEvent(traceId, spanId, 'pr-info', { pr: pr.number, model: reviewerConfig.model });

    const review = {
        pr: pr.number,
        title: pr.title,
        files: pr.files,
        findings: [],
        summary: '',
    };

    // Analyze each file
    for (const file of pr.files) {
        const fileSpanId = tracer.startSpan({ traceId, operation: `analyze-${file.name}`, parentSpanId: spanId });

        const findings = analyzeFile(file);
        review.findings.push(...findings);

        tracer.recordTokens(traceId, fileSpanId, { promptTokens: Math.ceil(file.content.length / 4), completionTokens: findings.length * 50 });
        tracer.endSpan(traceId, fileSpanId);
    }

    // Generate summary
    review.summary = generateReviewSummary(review.findings);

    tracer.endSpan(traceId, spanId);
    tracer.completeTrace(traceId);

    // Log in audit trail
    governance.audit.record({
        agentId: 'github-bot',
        action: 'pr-reviewed',
        resource: `PR #${pr.number}`,
        details: { findingCount: review.findings.length },
    });

    return review;
}

// ── File Analysis (simulated — replace with actual LLM call) ────────────

function analyzeFile(file) {
    const findings = [];
    const lines = file.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Security checks
        if (/eval\(/.test(line)) {
            findings.push({ type: 'security', severity: 'critical', file: file.name, line: i + 1, message: 'Use of eval() — potential code injection vulnerability', suggestion: 'Use JSON.parse() or a safe expression evaluator instead' });
        }
        if (/password\s*=\s*['"]/.test(line)) {
            findings.push({ type: 'security', severity: 'critical', file: file.name, line: i + 1, message: 'Hardcoded password detected', suggestion: 'Use environment variables or a secrets manager' });
        }

        // Bug checks
        if (/==\s/.test(line) && !/===/.test(line) && !/!==/.test(line)) {
            findings.push({ type: 'bug', severity: 'medium', file: file.name, line: i + 1, message: 'Loose equality (==) instead of strict (===)', suggestion: 'Use === for type-safe comparison' });
        }

        // Style checks
        if (line.length > 120) {
            findings.push({ type: 'style', severity: 'low', file: file.name, line: i + 1, message: `Line exceeds 120 characters (${line.length})`, suggestion: 'Break into multiple lines for readability' });
        }
    }

    return findings;
}

function generateReviewSummary(findings) {
    const critical = findings.filter(f => f.severity === 'critical').length;
    const medium = findings.filter(f => f.severity === 'medium').length;
    const low = findings.filter(f => f.severity === 'low').length;

    if (critical > 0) return `🔴 CHANGES REQUESTED: ${critical} critical issue(s) found. Please fix before merging.`;
    if (medium > 0) return `🟡 SUGGESTIONS: ${medium} improvement(s) suggested. Consider addressing before merge.`;
    if (low > 0) return `🟢 APPROVED with minor suggestions: ${low} style note(s).`;
    return '✅ APPROVED: No issues found. LGTM!';
}

// ── Issue Triage ────────────────────────────────────────────────────────

async function triageIssue(issue) {
    const labels = [];
    const title = issue.title.toLowerCase();
    const body = (issue.body || '').toLowerCase();
    const text = `${title} ${body}`;

    if (text.includes('bug') || text.includes('error') || text.includes('crash')) labels.push('bug');
    if (text.includes('feature') || text.includes('request') || text.includes('enhancement')) labels.push('enhancement');
    if (text.includes('docs') || text.includes('documentation')) labels.push('documentation');
    if (text.includes('security') || text.includes('vulnerability')) labels.push('security', 'priority:high');
    if (text.includes('performance') || text.includes('slow')) labels.push('performance');
    if (text.includes('help') || text.includes('question')) labels.push('question');

    const priority = labels.includes('security') ? 'P0'
        : labels.includes('bug') ? 'P1'
            : labels.includes('enhancement') ? 'P2'
                : 'P3';

    governance.audit.record({
        agentId: 'github-bot',
        action: 'issue-triaged',
        resource: `Issue #${issue.number}`,
        details: { labels, priority },
    });

    return { issue: issue.number, labels, priority, autoAssign: priority === 'P0' };
}

// ── Demo Runner ─────────────────────────────────────────────────────────

async function demo() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       Ultra-Dex GitHub Bot Example              ║');
    console.log('║       PR Review + Issue Triage                  ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log();

    // Demo PR Review
    console.log('📋 Reviewing PR #42...');
    const review = await reviewPullRequest({
        number: 42,
        title: 'Add user authentication',
        files: [
            { name: 'auth.js', content: 'const password = "admin123";\nif (user == null) return;\nconsole.log("' + 'x'.repeat(130) + '");' },
            { name: 'utils.js', content: 'function clean() { return true; }' },
        ],
    });

    console.log(`   Summary: ${review.summary}`);
    console.log(`   Findings: ${review.findings.length}`);
    for (const f of review.findings) {
        console.log(`   ${f.severity === 'critical' ? '🔴' : f.severity === 'medium' ? '🟡' : '🟢'} [${f.type}] ${f.file}:${f.line} — ${f.message}`);
    }
    console.log();

    // Demo Issue Triage
    console.log('🏷️  Triaging issues...');
    const issues = [
        { number: 101, title: 'App crashes on login', body: 'Getting a null pointer error when logging in' },
        { number: 102, title: 'Feature request: dark mode', body: 'Would love a dark mode enhancement' },
        { number: 103, title: 'Security vulnerability in auth', body: 'Found an XSS vulnerability in the login form' },
    ];

    for (const issue of issues) {
        const result = await triageIssue(issue);
        console.log(`   Issue #${result.issue}: ${result.priority} → [${result.labels.join(', ')}]${result.autoAssign ? ' ⚠️ AUTO-ASSIGN' : ''}`);
    }
    console.log();

    // Show governance stats
    console.log('🏛️  Governance Dashboard:', JSON.stringify(governance.getDashboard(), null, 2));
}

demo().catch(console.error);

export { reviewPullRequest, triageIssue };
