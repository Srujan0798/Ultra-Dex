// cli/lib/commands/export.js
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export function exportCommand(options) {
  const format = options.format || 'json';
  console.log(chalk.cyan.bold(`\n📦 Exporting as ${format.toUpperCase()}\n`));

  const context = loadContext();
  
  const outputFile = `ultra-dex-export.${format}`;
  
  if (format === 'json') {
    writeFileSync(outputFile, JSON.stringify(context, null, 2));
  } else if (format === 'html') {
    writeFileSync(outputFile, generateHTML(context));
  } else {
    writeFileSync(outputFile, generateMarkdown(context));
  }
  
  console.log(chalk.green(`✅ Exported to ${outputFile}`));
}

function loadContext() {
  const files = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'QUICK-START.md'];
  const context = {};
  
  files.forEach(file => {
    const path = join(process.cwd(), file);
    if (existsSync(path)) {
      context[file] = readFileSync(path, 'utf-8');
    }
  });
  
  return context;
}

function generateHTML(context) {
  return `<!DOCTYPE html>
<html><head><title>Ultra-Dex Export</title>
<style>
  body { font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 900px; margin: 0 auto; background: #f4f4f9; }
  pre { background: #282c34; color: #abb2bf; padding: 15px; border-radius: 5px; overflow-x: auto; }
  h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
  h2 { color: #2980b9; margin-top: 30px; }
</style>
</head>
<body>
<h1>Ultra-Dex Project Export</h1>
${Object.entries(context).map(([file, content]) => `
  <h2>${file}</h2>
  <pre>${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
`).join('')}
</body></html>`;
}

function generateMarkdown(context) {
  return Object.entries(context).map(([file, content]) => 
    `# ${file}\n\n${content}`
  ).join('\n\n---\n\n');
}