// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview CLI Router Command
 * @module commands/router
 *
 * Provides interactive control over the SDK Smart Router from the CLI.
 * Commands: status, set-strategy, benchmark, stats
 */

import chalk from 'chalk';
import { SmartRouter, ProviderStats } from '../../../packages/sdk/src/router.js';

// ---------------------------------------------------------------------------
// Mock provider registry (in production, loads from config)
// ---------------------------------------------------------------------------

const PROVIDER_CATALOG = [
    { name: 'openai', label: 'OpenAI GPT-4o', costPerToken: 0.000030, avgMs: 320 },
    { name: 'claude', label: 'Claude 3.5 Sonnet', costPerToken: 0.000015, avgMs: 410 },
    { name: 'gemini', label: 'Gemini 2.0 Flash', costPerToken: 0.000004, avgMs: 180 },
    { name: 'deepseek', label: 'Deepseek R1', costPerToken: 0.000002, avgMs: 520 },
    { name: 'mistral', label: 'Mistral Large', costPerToken: 0.000008, avgMs: 290 },
    { name: 'llama', label: 'Llama 3.3 70B', costPerToken: 0.000002, avgMs: 650 },
    { name: 'grok', label: 'Grok 3', costPerToken: 0.000010, avgMs: 380 },
];

function createSimRouter(strategy = 'fastest') {
    const costPerToken = {};
    PROVIDER_CATALOG.forEach((p) => { costPerToken[p.name] = p.costPerToken; });

    const router = new SmartRouter({
        strategy,
        costPerToken,
        circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 30_000 },
    });

    // Simulate providers with realistic latency spread
    for (const p of PROVIDER_CATALOG) {
        router.addProvider(p.name, {
            async chat() {
                const jitter = Math.random() * 0.4 + 0.8; // 0.8x - 1.2x
                await new Promise((r) => setTimeout(r, Math.round(p.avgMs * jitter * 0.01)));
                return {
                    role: 'assistant',
                    content: `Response from ${p.label}`,
                    usage: {
                        promptTokens: Math.floor(Math.random() * 200 + 50),
                        completionTokens: Math.floor(Math.random() * 400 + 100),
                    },
                };
            },
            async *stream() { yield { delta: 'chunk' }; },
            async embed() { return { embedding: [0.1] }; },
        });
    }
    return router;
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function strategyBadge(strategy) {
    const badges = {
        fastest: chalk.greenBright('⚡ fastest'),
        cheapest: chalk.yellowBright('💰 cheapest'),
        'round-robin': chalk.cyanBright('🔄 round-robin'),
        'fallback-chain': chalk.magentaBright('🔗 fallback-chain'),
    };
    return badges[strategy] || chalk.white(strategy);
}

function healthDot(state) {
    return state === 'closed' ? chalk.green('●')
        : state === 'half-open' ? chalk.yellow('●')
            : chalk.red('●');
}

function latencyColor(ms) {
    if (ms < 300) return chalk.green(`${ms}ms`);
    if (ms < 600) return chalk.yellow(`${ms}ms`);
    return chalk.red(`${ms}ms`);
}

function pad(str, len) {
    return String(str).padEnd(len);
}

// ---------------------------------------------------------------------------
// Subcommand: status
// ---------------------------------------------------------------------------

function printStatus(router) {
    const stats = router.getAllStats();
    const providers = Object.keys(stats);

    console.log();
    console.log(chalk.bold.white('  Ultra-Dex Smart Router'));
    console.log(chalk.gray('  ─────────────────────────────────────────────'));
    console.log(`  Strategy     ${strategyBadge(router.strategy)}`);
    console.log(`  Providers    ${chalk.white(providers.length)} registered`);
    console.log(`  Total Reqs   ${chalk.white(router.totalRequests)}`);
    console.log(`  Total Cost   ${chalk.yellowBright('$' + router.totalCost.toFixed(4))}`);
    console.log();

    // Provider table
    console.log(chalk.gray('  ' + pad('Provider', 22) + pad('Reqs', 8) + pad('Avg', 10) + pad('P95', 10) + pad('Err%', 8) + 'Health'));
    console.log(chalk.gray('  ' + '─'.repeat(68)));

    for (const name of providers) {
        const s = stats[name];
        const catalog = PROVIDER_CATALOG.find((p) => p.name === name);
        const label = catalog ? catalog.label : name;
        console.log(
            '  ' +
            chalk.white(pad(label, 22)) +
            pad(s.requestCount, 8) +
            latencyColor(s.avgLatency).padEnd(19) +
            latencyColor(s.p95).padEnd(19) +
            (s.errorRate > 0.01 ? chalk.red : chalk.green)(`${(s.errorRate * 100).toFixed(1)}%`).padEnd(17) +
            healthDot(s.circuitState) + ' ' + chalk.gray(s.circuitState)
        );
    }
    console.log();
}

// ---------------------------------------------------------------------------
// Subcommand: benchmark
// ---------------------------------------------------------------------------

async function runBenchmark(router, rounds = 5) {
    console.log();
    console.log(chalk.bold.white('  Running Smart Router Benchmark'));
    console.log(chalk.gray(`  ${rounds} rounds × ${PROVIDER_CATALOG.length} providers\n`));

    const msgs = [{ role: 'user', content: 'Hello benchmark' }];

    for (let i = 0; i < rounds; i++) {
        process.stdout.write(chalk.gray(`  Round ${i + 1}/${rounds}... `));
        try {
            const result = await router.route('chat', [msgs, {}]);
            console.log(chalk.green(`✓ ${result.provider} ${result.latencyMs}ms`));
        } catch (err) {
            console.log(chalk.red(`✗ ${err.message}`));
        }
    }

    console.log();
    printStatus(router);
}

// ---------------------------------------------------------------------------
// Subcommand: stats (detailed)
// ---------------------------------------------------------------------------

function printDetailedStats(router) {
    const allStats = router.getAllStats();
    console.log();
    console.log(chalk.bold.white('  Detailed Provider Statistics'));
    console.log(chalk.gray('  ─────────────────────────────────────────────'));

    for (const [name, s] of Object.entries(allStats)) {
        const catalog = PROVIDER_CATALOG.find((p) => p.name === name);
        const label = catalog ? catalog.label : name;

        console.log();
        console.log(chalk.bold.white(`  ${label}`));
        console.log(`    Requests       ${chalk.white(s.requestCount)}`);
        console.log(`    Errors         ${chalk.white(s.errorCount)} (${(s.errorRate * 100).toFixed(2)}%)`);
        console.log(`    Avg Latency    ${latencyColor(s.avgLatency)}`);
        console.log(`    P50            ${latencyColor(s.p50)}`);
        console.log(`    P95            ${latencyColor(s.p95)}`);
        console.log(`    P99            ${latencyColor(s.p99)}`);
        console.log(`    Tokens         ${chalk.white(s.totalTokens.toLocaleString())}`);
        console.log(`    Cost           ${chalk.yellowBright('$' + s.totalCost.toFixed(6))}`);
        console.log(`    Circuit        ${healthDot(s.circuitState)} ${chalk.gray(s.circuitState)}`);
    }
    console.log();
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerRouterCommand(program) {
    const cmd = program
        .command('router')
        .description('Smart Router — intelligent provider routing, benchmarks & monitoring');

    cmd
        .command('status')
        .description('Show router status, provider health, and strategy')
        .action(() => {
            const router = createSimRouter();
            printStatus(router);
        });

    cmd
        .command('set-strategy <strategy>')
        .description('Switch routing strategy (fastest | cheapest | round-robin | fallback-chain)')
        .action((strategy) => {
            const valid = ['fastest', 'cheapest', 'round-robin', 'fallback-chain'];
            if (!valid.includes(strategy)) {
                console.error(chalk.red(`\n  Invalid strategy "${strategy}". Choose: ${valid.join(', ')}\n`));
                process.exit(1);
            }
            const router = createSimRouter(strategy);
            console.log(chalk.green(`\n  ✓ Strategy set to ${strategyBadge(strategy)}\n`));
            printStatus(router);
        });

    cmd
        .command('benchmark')
        .description('Run a quick latency benchmark across all providers')
        .option('-r, --rounds <n>', 'Number of rounds', '5')
        .action(async (opts) => {
            const router = createSimRouter('fallback-chain');
            await runBenchmark(router, parseInt(opts.rounds, 10));
        });

    cmd
        .command('stats')
        .description('Show detailed per-provider statistics (p50/p95/p99, cost, errors)')
        .action(async () => {
            const router = createSimRouter('fastest');
            // Warm up with a few requests for meaningful stats
            const msgs = [{ role: 'user', content: 'stats warmup' }];
            console.log(chalk.gray('\n  Warming up (10 requests)...\n'));
            for (let i = 0; i < 10; i++) {
                try { await router.route('chat', [msgs, {}]); } catch { }
            }
            printDetailedStats(router);
        });
}

export default registerRouterCommand;
