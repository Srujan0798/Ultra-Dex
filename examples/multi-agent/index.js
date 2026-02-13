// Copyright (c) 2026 Ultra-Dex
// Example: Multi-Agent Coordination

/**
 * Demonstrates the Agent Mesh coordinating 3 specialized agents:
 *   1. Research Agent   — gathers information
 *   2. Analysis Agent   — processes and evaluates data
 *   3. Writer Agent     — synthesizes into final output
 *
 * Uses:
 *   - Agent Mesh (task queue, message bus, consensus)
 *   - Agent Templates (pre-built configs)
 *   - Token Guard (budget management)
 *   - Chaos Engine (resilience testing)
 *   - Governance (audit trail)
 *
 * Usage:  node examples/multi-agent/index.js
 */

import { AgentMesh } from '../../src/core/coordination/agent-mesh.js';
import { TokenGuard } from '../../src/core/optimization/token-guard.js';
import { TemplateRegistry } from '../../src/core/templates/agent-templates.js';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { TraceCollector } from '../../src/core/observability/trace-collector.js';
import { ChaosEngine } from '../../src/core/testing/chaos-engine.js';

// ── Setup ───────────────────────────────────────────────────────────────

const mesh = new AgentMesh();
const tokenGuard = new TokenGuard({ globalBudget: 10.0 });
const templates = new TemplateRegistry();
templates.loadBuiltIns();
const governance = new GovernanceManager();
const tracer = new TraceCollector();

// ── Agent Definitions ───────────────────────────────────────────────────

const agents = {
    researcher: {
        id: 'researcher',
        name: 'Research Agent',
        role: 'research',
        capabilities: ['web-search', 'synthesis', 'fact-checking'],
        model: 'gemini-2.0-flash',
        async execute(task) {
            // Simulate research work
            await sleep(100);
            const sources = [
                { title: 'Official Docs', relevance: 0.95, summary: 'Primary documentation for the topic' },
                { title: 'Academic Paper', relevance: 0.82, summary: 'Research findings supporting the approach' },
                { title: 'Community Forum', relevance: 0.71, summary: 'Real-world usage experiences' },
            ];
            return { sources, confidence: 0.88, tokensUsed: 1200 };
        },
    },

    analyst: {
        id: 'analyst',
        name: 'Analysis Agent',
        role: 'analysis',
        capabilities: ['data-transformation', 'validation', 'error-handling'],
        model: 'gpt-4o',
        async execute(task, researchData) {
            await sleep(80);
            const analysis = {
                strengths: ['Well-documented', 'Active community', 'Production-tested'],
                weaknesses: ['Learning curve', 'Setup complexity'],
                recommendation: 'Recommended with caveats',
                confidenceScore: 0.91,
            };
            return { analysis, tokensUsed: 800 };
        },
    },

    writer: {
        id: 'writer',
        name: 'Writer Agent',
        role: 'documentation',
        capabilities: ['writing', 'markdown-generation'],
        model: 'gpt-4o-mini',
        async execute(task, researchData, analysisData) {
            await sleep(60);
            const report = `# ${task.topic}\n\n## Research Summary\nBased on ${researchData.sources.length} sources (confidence: ${researchData.confidence}).\n\n## Analysis\n**Strengths:** ${analysisData.analysis.strengths.join(', ')}\n**Weaknesses:** ${analysisData.analysis.weaknesses.join(', ')}\n\n## Recommendation\n${analysisData.analysis.recommendation} (confidence: ${analysisData.analysis.confidenceScore})`;
            return { report, tokensUsed: 600 };
        },
    },
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Register Agents ─────────────────────────────────────────────────────

function registerAgents() {
    for (const [id, agent] of Object.entries(agents)) {
        mesh.registerAgent(id, {
            name: agent.name,
            capabilities: agent.capabilities,
            constraints: { maxConcurrent: 3 },
        });
    }
}

// ── Multi-Agent Pipeline ────────────────────────────────────────────────

async function runPipeline(topic) {
    const traceId = tracer.startTrace({ agentId: 'pipeline', task: `pipeline-${topic.replace(/\s+/g, '-')}` });

    console.log(`\n🚀 Starting multi-agent pipeline: "${topic}"`);
    console.log('─'.repeat(50));

    const totalCost = { tokens: 0, steps: 0 };

    // Step 1: Research
    console.log('\n📚 Step 1: Research Agent gathering data...');
    const researchSpanId = tracer.startSpan({ traceId, operation: 'research' });
    const gate1 = await governance.gate({ agentId: 'researcher', action: 'web-search', resource: topic });
    if (!gate1.allowed) throw new Error(`Blocked: ${gate1.reason}`);

    const researchResult = await agents.researcher.execute({ topic });
    tracer.recordTokens(traceId, researchSpanId, { completionTokens: researchResult.tokensUsed });
    tracer.endSpan(traceId, researchSpanId);
    totalCost.tokens += researchResult.tokensUsed;
    totalCost.steps++;

    console.log(`   ✅ Found ${researchResult.sources.length} sources (confidence: ${researchResult.confidence})`);
    for (const s of researchResult.sources) {
        console.log(`      → ${s.title} (relevance: ${s.relevance})`);
    }

    // Step 2: Analysis
    console.log('\n🔍 Step 2: Analysis Agent processing data...');
    const analysisSpanId = tracer.startSpan({ traceId, operation: 'analysis' });
    const analysisResult = await agents.analyst.execute({ topic }, researchResult);
    tracer.recordTokens(traceId, analysisSpanId, { promptTokens: Math.ceil(researchResult.tokensUsed / 4), completionTokens: analysisResult.tokensUsed });
    tracer.endSpan(traceId, analysisSpanId);
    totalCost.tokens += analysisResult.tokensUsed;
    totalCost.steps++;

    console.log(`   ✅ Analysis complete (confidence: ${analysisResult.analysis.confidenceScore})`);
    console.log(`      Strengths: ${analysisResult.analysis.strengths.join(', ')}`);
    console.log(`      Weaknesses: ${analysisResult.analysis.weaknesses.join(', ')}`);

    // Step 3: Consensus Check (inline voting)
    console.log('\n🤝 Step 3: Consensus check between agents...');
    const consensusSpanId = tracer.startSpan({ traceId, operation: 'consensus' });
    const votes = [
        { agentId: 'researcher', vote: researchResult.confidence >= 0.7 ? 'approve' : 'reject', confidence: researchResult.confidence },
        { agentId: 'analyst', vote: analysisResult.analysis.confidenceScore >= 0.7 ? 'approve' : 'reject', confidence: analysisResult.analysis.confidenceScore },
    ];
    const approvals = votes.filter(v => v.vote === 'approve').length;
    const consensusResult = { decision: approvals / votes.length >= 0.66 ? 'approve' : 'reject', votes };
    tracer.endSpan(traceId, consensusSpanId);
    totalCost.steps++;

    console.log(`   ${consensusResult.decision === 'approve' ? '✅' : '❌'} Consensus: ${consensusResult.decision} (${consensusResult.votes.length} votes)`);

    // Step 4: Write Report
    console.log('\n✍️  Step 4: Writer Agent synthesizing report...');
    const writeSpanId = tracer.startSpan({ traceId, operation: 'writing' });
    const writeResult = await agents.writer.execute({ topic }, researchResult, analysisResult);
    tracer.recordTokens(traceId, writeSpanId, { promptTokens: Math.ceil((researchResult.tokensUsed + analysisResult.tokensUsed) / 4), completionTokens: writeResult.tokensUsed });
    tracer.endSpan(traceId, writeSpanId);
    totalCost.tokens += writeResult.tokensUsed;
    totalCost.steps++;

    console.log(`   ✅ Report generated (${writeResult.report.length} characters)`);

    // Complete trace
    tracer.completeTrace(traceId);

    // Log in governance
    governance.audit.record({
        agentId: 'pipeline',
        action: 'pipeline-complete',
        resource: topic,
        details: { steps: totalCost.steps, tokens: totalCost.tokens, consensus: consensusResult.decision },
    });

    return {
        report: writeResult.report,
        totalTokens: totalCost.tokens,
        steps: totalCost.steps,
        estimatedCost: `$${(totalCost.tokens * 0.000003).toFixed(4)}`,
        traceId,
    };
}

// ── Chaos Testing ───────────────────────────────────────────────────────

async function chaosTest() {
    console.log('\n\n🌪️  Running Chaos Test on Pipeline...');
    console.log('═'.repeat(50));

    const chaos = new ChaosEngine();
    const campaign = await chaos.runCampaign(
        async () => {
            // Test that agents can handle adversity
            const result = await agents.researcher.execute({ topic: 'chaos test' });
            return result.confidence > 0.5 ? 'ok' : null;
        },
        {
            name: 'multi-agent-resilience',
            attacks: ['error-injection', 'latency-injection'],
            config: {
                'error-injection': { errorRate: 0.2, attempts: 5 },
                'latency-injection': { minMs: 10, maxMs: 50, timeoutMs: 5000 },
            },
        }
    );

    const report = chaos.generateReport();
    console.log(`\n   Grade: ${report.grade}`);
    console.log(`   Survival Rate: ${report.survivalRate}`);
    console.log(`   Recommendation: ${report.recommendation}`);

    return report;
}

// ── Demo Runner ─────────────────────────────────────────────────────────

async function demo() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       Ultra-Dex Multi-Agent Example             ║');
    console.log('║       3 Agents + Mesh + Consensus + Chaos       ║');
    console.log('╚══════════════════════════════════════════════════╝');

    registerAgents();

    // Run pipeline
    const result = await runPipeline('AI Orchestration Best Practices');

    console.log('\n═══════════════════════════════════════════════════');
    console.log('📄 FINAL REPORT:');
    console.log('═══════════════════════════════════════════════════');
    console.log(result.report);
    console.log('\n📊 Pipeline Stats:');
    console.log(`   Total Tokens: ${result.totalTokens}`);
    console.log(`   Estimated Cost: ${result.estimatedCost}`);
    console.log(`   Steps: ${result.steps}`);
    console.log(`   Trace ID: ${result.traceId}`);

    // Run chaos test
    await chaosTest();

    // Show governance dashboard
    console.log('\n🏛️  Governance:', JSON.stringify(governance.getDashboard(), null, 2));
}

demo().catch(console.error);

export { runPipeline, agents, registerAgents };
