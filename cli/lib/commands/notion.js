// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { NotionClient, validateNotionConfig } from '../integrations/notion.js';
import { parsePlanFromMarkdown } from './plan.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

const STATUS_MAP = {
  completed: 'Done',
  in_progress: 'In Progress',
  pending: 'Not Started',
};

function extractText(property) {
  if (!property) return '';
  if (property.title && property.title.length > 0) {
    return property.title.map((t) => t.plain_text).join('');
  }
  if (property.rich_text && property.rich_text.length > 0) {
    return property.rich_text.map((t) => t.plain_text).join('');
  }
  if (property.select?.name) return property.select.name;
  return '';
}

async function loadPlanSections() {
  const phases = await parsePlanFromMarkdown();
  return phases.map((phase) => {
    const status = STATUS_MAP[phase.status] || 'Not Started';
    const description = phase.steps
      ? phase.steps
          .map((step) => `- [${step.status === 'completed' ? 'x' : ' '}] ${step.task}`)
          .join('\n')
      : '';

    return {
      name: phase.name || 'Untitled Phase',
      status,
      priority: 'Medium',
      description,
    };
  });
}

export function registerNotionCommand(program) {
  const notion = new Command('notion');
  notion.description('Notion integration helpers');

  notion
    .command('export')
    .description('Export IMPLEMENTATION-PLAN.md to Notion database')
    .option('--database-id <id>', 'Notion database ID')
    .action(async (options) => {
      const apiToken = process.env.NOTION_API_TOKEN;
      const databaseId = options.databaseId || process.env.NOTION_DATABASE_ID;

      try {
        if (!databaseId) {
          printError(chalk.red('Missing Notion database ID. Use --database-id or set NOTION_DATABASE_ID.'));
          return;
        }
        await validateNotionConfig({ apiToken, databaseId });

        const client = new NotionClient(apiToken);
        const sections = await loadPlanSections();

        if (!sections.length) {
          printWarning(chalk.yellow('No phases found in IMPLEMENTATION-PLAN.md.'));
          return;
        }

        await client.syncPlanToNotion(databaseId, { sections });
        printSuccess(chalk.green(`✅ Exported ${sections.length} sections to Notion.`));
      } catch (error) {
        printError(chalk.red(`Notion export failed: ${error.message}`));
      }
    });

  notion
    .command('import')
    .description('Import Notion database items into IMPLEMENTATION-PLAN.md')
    .option('--database-id <id>', 'Notion database ID')
    .option('-o, --output <path>', 'Output file path', 'IMPLEMENTATION-PLAN.md')
    .action(async (options) => {
      const apiToken = process.env.NOTION_API_TOKEN;
      const databaseId = options.databaseId || process.env.NOTION_DATABASE_ID;
      const outputPath = path.resolve(process.cwd(), options.output);

      try {
        if (!databaseId) {
          printError(chalk.red('Missing Notion database ID. Use --database-id or set NOTION_DATABASE_ID.'));
          return;
        }
        await validateNotionConfig({ apiToken, databaseId });

        const client = new NotionClient(apiToken);
        const response = await client.queryDatabase(databaseId);
        const pages = response.results || [];

        const lines = ['# IMPLEMENTATION PLAN', ''];
        for (const page of pages) {
          const title = extractText(page.properties?.Name) || 'Untitled Section';
          const status = extractText(page.properties?.Status) || 'Not Started';
          const priority = extractText(page.properties?.Priority) || 'Medium';
          const description = extractText(page.properties?.Description);

          lines.push(`## ${title}`);
          lines.push(`- Status: ${status}`);
          lines.push(`- Priority: ${priority}`);
          if (description) {
            lines.push('', description);
          }
          lines.push('');
        }

        await fs.writeFile(outputPath, lines.join('\n'), 'utf8');
        printSuccess(chalk.green(`✅ Imported ${pages.length} sections into ${outputPath}`));
      } catch (error) {
        printError(chalk.red(`Notion import failed: ${error.message}`));
      }
    });

  program.addCommand(notion);
}
