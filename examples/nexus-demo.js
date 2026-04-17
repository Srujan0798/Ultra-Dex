// Copyright (c) 2026 Ultra-Dex
/**
 * Ultra-Dex Nexus Autonomous Mode Demo
 * This script demonstrates the autonomous "Think-Act-Verify" loop
 */

import chalk from 'chalk';

async function runDemo() {
  console.log(
    chalk.bold('\n  ██╗   ██╗██╗  ████████╗██████╗  █████╗        ██████╗ ███████╗██╗  ██╗')
  );
  console.log(
    chalk.bold('  ██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗      ██╔══██╗██╔════╝╚██╗██╔╝')
  );
  console.log(
    chalk.bold('  ██║   ██║██║     ██║   ██████╔╝███████║█████╗██║  ██║█████╗   ╚███╔╝ ')
  );
  console.log(
    chalk.bold('  ██║   ██║██║     ██║   ██╔══██╗██╔══██║╚════╝██║  ██║██╔══╝   ██╔██╗ ')
  );
  console.log(
    chalk.bold('  ╚██████╔╝███████╗██║   ██║  ██║██║  ██║      ██████╔╝███████╗██╔╝ ██╗')
  );
  console.log(
    chalk.bold('   ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝\n')
  );

  console.log(chalk.dim('  AI Orchestration Meta-Layer  •  13 Providers  •  83 Skills  •  9 Agents\n'));
  console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────\n'));

  const objective =
    'Build a production-ready authentication service with JWT tokens, refresh logic, and rate limiting.';

  console.log(chalk.bold.white('  Objective'));
  console.log(chalk.cyan(`  ${objective}\n`));
  console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────\n'));

  await pause(400);

  // Routing
  console.log(chalk.bold.yellow('  ◈  Routing'));
  await pause(300);
  console.log(chalk.dim('     Provider  ') + chalk.green('anthropic') + chalk.dim(' (quality strategy)'));
  console.log(chalk.dim('     Agent     ') + chalk.green('@Backend') + chalk.dim(' + @Auth + @Reviewer'));
  console.log(chalk.dim('     Skill     ') + chalk.green('/code-review') + chalk.dim(' + /architecture'));
  console.log(chalk.dim('     Memory    ') + chalk.green('3 relevant entries found\n'));

  await pause(600);

  // Governance
  console.log(chalk.bold.yellow('  ◈  Governance'));
  await pause(300);
  console.log(chalk.dim('     Policy    ') + chalk.green('✓ Passed'));
  console.log(chalk.dim('     Audit     ') + chalk.green('✓ Logged'));
  console.log(chalk.dim('     Risk      ') + chalk.green('low  •  no PII  •  no external calls\n'));

  await pause(600);

  // Swarm execution
  const agents = [
    { name: '@Auth', task: 'JWT sign/verify + refresh token rotation', ms: 1240 },
    { name: '@Backend', task: 'Rate limiter middleware (sliding window)', ms: 980 },
    { name: '@Reviewer', task: 'Security audit — OWASP Top 10 check', ms: 760 },
  ];

  console.log(chalk.bold.yellow('  ◈  Swarm Execution'));
  await pause(300);

  for (const agent of agents) {
    process.stdout.write(chalk.dim(`     ${agent.name.padEnd(12)}`));
    await pause(agent.ms / 4);
    process.stdout.write(chalk.dim('running...'));
    await pause(agent.ms / 4);
    process.stdout.write(chalk.dim('\r') + chalk.dim(`     ${agent.name.padEnd(12)}`) + chalk.green(`✓  ${agent.task}`) + chalk.dim(` (${agent.ms}ms)\n`));
    await pause(200);
  }

  console.log();
  await pause(400);

  // Output
  console.log(chalk.bold.yellow('  ◈  Output'));
  await pause(300);
  console.log(chalk.dim('     Files     ') + chalk.white('auth.service.ts  •  auth.middleware.ts  •  auth.test.ts'));
  console.log(chalk.dim('     Tokens    ') + chalk.white('4,821 prompt  •  1,203 completion'));
  console.log(chalk.dim('     Cost      ') + chalk.white('$0.0031'));
  console.log(chalk.dim('     Latency   ') + chalk.white('2.98s\n'));

  await pause(400);

  console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────'));
  console.log(chalk.bold.green('\n  ✓  Task complete\n'));
  console.log(chalk.dim('  Run a real task:  ') + chalk.white('ultra-dex run "<your objective>"'));
  console.log(chalk.dim('  List skills:      ') + chalk.white('ultra-dex skill --list'));
  console.log(chalk.dim('  Launch swarm:     ') + chalk.white('ultra-dex swarm "<objective>"\n'));
}

function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

runDemo().catch(console.error);
