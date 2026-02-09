# 🖥️ Agent Prompt: Enhance 10 CLI Commands

---

## 1. cli/lib/commands/check.js - Enhanced Validation

Add flags:
- `--p0-only`: Check only P0 critical sections
- `--strict`: Exit with error on any incomplete section
- `--fix`: Auto-fix common issues (format, structure)
- `--json`: Output as JSON for CI

```javascript
.option('--p0-only', 'Only check P0 critical sections')
.option('--strict', 'Fail on any incomplete section')
.option('--fix', 'Auto-fix common issues')
.option('--json', 'Output as JSON')
.action(async (options) => {
  const sections = await loadPlanSections();
  const filtered = options.p0Only ? sections.filter(s => s.priority === 'P0') : sections;
  
  const results = filtered.map(section => ({
    name: section.name,
    status: evaluateCompleteness(section),
    issues: findIssues(section)
  }));
  
  if (options.fix) {
    await autoFix(results.filter(r => r.status !== 'complete'));
  }
  
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    displayColorCoded(results);
  }
  
  if (options.strict && results.some(r => r.status !== 'complete')) {
    process.exit(1);
  }
});
```

---

## 2. cli/lib/commands/export.js - Multi-Format

Add formats: yaml, json, pdf, html, notion, markdown

```javascript
.option('-f, --format <type>', 'Output format (yaml|json|pdf|html|notion|md)', 'md')
.option('-t, --template <name>', 'Template (executive|technical|handoff)')
.option('--sections <list>', 'Include only these sections')
.option('--exclude <list>', 'Exclude these sections')
.action(async (options) => {
  const plan = await loadPlan();
  const filtered = filterSections(plan, options.sections, options.exclude);
  
  switch (options.format) {
    case 'yaml': return exportYAML(filtered);
    case 'json': return exportJSON(filtered);
    case 'pdf': return exportPDF(filtered, options.template);
    case 'html': return exportHTML(filtered, options.template);
    case 'notion': return exportToNotion(filtered);
    default: return exportMarkdown(filtered);
  }
});
```

---

## 3. NEW: cli/lib/commands/template.js

```javascript
import { program } from 'commander';
import { glob } from 'glob';
import fs from 'fs-extra';
import path from 'path';

export function register(prog) {
  const cmd = prog.command('template');
  
  cmd
    .command('list')
    .description('List available templates')
    .action(async () => {
      const templates = await getAvailableTemplates();
      console.log('\n📦 Available Templates:\n');
      templates.forEach(t => {
        console.log(`  ${t.name.padEnd(20)} - ${t.description}`);
      });
    });
  
  cmd
    .command('generate <name>')
    .description('Generate project from template')
    .option('-o, --output <dir>', 'Output directory', '.')
    .option('--dry-run', 'Preview without creating files')
    .action(async (name, options) => {
      const template = await loadTemplate(name);
      if (!template) {
        console.error(`Template '${name}' not found`);
        process.exit(1);
      }
      
      if (options.dryRun) {
        console.log('Would create:');
        template.files.forEach(f => console.log(`  ${f}`));
        return;
      }
      
      await copyTemplate(template, options.output);
      console.log(`✅ Created ${name} project in ${options.output}`);
    });
  
  cmd
    .command('info <name>')
    .description('Show template details')
    .action(async (name) => {
      const template = await loadTemplate(name);
      console.log(template.readme);
    });
}

async function getAvailableTemplates() {
  return [
    { name: 'saaskit', description: 'B2B Multi-tenant SaaS' },
    { name: 'habitstack', description: 'B2C Habit Tracker' },
    { name: 'contentstudio', description: 'CMS Platform' },
    { name: 'courseforge', description: 'LMS System' },
    { name: 'devtoolshub', description: 'API Platform' }
  ];
}
```

---

## 4. NEW: cli/lib/commands/production-ready.js

```javascript
export function register(program) {
  program
    .command('production-ready')
    .alias('launch-check')
    .description('Check if project is ready for production')
    .option('--fix', 'Auto-fix issues where possible')
    .action(async (options) => {
      const checks = [
        { name: 'Tests Passing', check: checkTests },
        { name: 'Security Audit', check: checkSecurity },
        { name: 'Env Vars Documented', check: checkEnvDocs },
        { name: 'README Complete', check: checkReadme },
        { name: 'License Present', check: checkLicense },
        { name: 'CI/CD Configured', check: checkCICD },
        { name: 'No Console.logs', check: checkConsoleLogs },
        { name: 'No Hardcoded Secrets', check: checkSecrets }
      ];
      
      let allPassed = true;
      for (const { name, check } of checks) {
        const result = await check();
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} ${name}`);
        if (!result.passed) allPassed = false;
      }
      
      if (allPassed) {
        console.log('\n🚀 Ready for production!');
      } else {
        console.log('\n⚠️ Fix issues before deploying');
        if (!options.fix) process.exit(1);
      }
    });
}
```

---

## 5. NEW: cli/lib/commands/reality-check.js

```javascript
export function register(program) {
  program
    .command('reality-check')
    .description('Audit project for tech debt and modernization opportunities')
    .action(async () => {
      console.log('🔍 Running Reality Check...\n');
      
      // Check outdated dependencies
      const outdated = await checkOutdatedDeps();
      console.log(`📦 Outdated Dependencies: ${outdated.length}`);
      
      // Check missing tests
      const untested = await findUntestedFiles();
      console.log(`🧪 Untested Files: ${untested.length}`);
      
      // Check security vulnerabilities
      const vulns = await runSecurityAudit();
      console.log(`🔒 Security Issues: ${vulns.length}`);
      
      // Calculate tech debt score
      const score = calculateTechDebtScore(outdated, untested, vulns);
      console.log(`\n📊 Tech Debt Score: ${score}/100`);
      
      if (score < 70) {
        console.log('⚠️ Consider addressing tech debt before new features');
      }
    });
}
```

---

## 6-10. Enhance existing commands

### memory.js
- Add `--visual` flag for progress bars
- Add `search` subcommand

### verify.js
- Complete Protocol 21 all 21 steps
- Add `--phase` filter

### governance.js (NEW)
- Run ADR checks
- List violations
- Apply fixes

### route.js (NEW)
- Configure model preferences
- Analyze routing decisions

### diff.js
- Smart drift detection
- Suggest fixes

---

**SUCCESS:** All 10 commands functional with help text and examples
