import fs from 'fs/promises';
import path from 'path';

interface SyncClassification {
  appFiles: string[];
  apiFiles: string[];
  schemaFiles: string[];
  configFiles: string[];
}

interface SyncSummary extends SyncClassification {
  generatedAt: string;
  root: string;
  fileCount: number;
  appCount: number;
  apiCount: number;
  schemaCount: number;
  configCount: number;
  stack: string;
  fileList: string[];
}

interface SnapshotResult {
  summary: SyncSummary;
  updated: boolean;
  missingContext: boolean;
  diff: {
    added: number;
    removed: number;
  };
}

const IGNORED_DIRS = /* @__PURE__ */ new Set([
  '.git',
  'node_modules',
  '.next',
  'dist',
  'build',
  'out',
  '.turbo',
  '.cache',
  '.ultra-dex',
  '.cursor',
  '.agents',
  'coverage',
  '.idea',
  '.vscode',
]);
const IGNORED_FILES = /* @__PURE__ */ new Set(['CONTEXT.md', '.DS_Store']);
const SNAPSHOT_DIR = '.ultra-dex';
const SNAPSHOT_FILE = 'context-snapshot.json';
const AUTO_SYNC_HEADER = '## Auto-Sync Snapshot';
const SCHEMA_PATTERNS = [
  /schema\.prisma$/i,
  /drizzle\/schema/i,
  /supabase\/migrations/i,
  /migrations\/.*\.(sql|ts|js)$/i,
  /db\/schema/i,
];
async function listFilesRecursive(rootDir: string, baseDir: string = rootDir): Promise<string[]> {
  let results: string[] = [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(rootDir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      results = results.concat(await listFilesRecursive(fullPath, baseDir));
    } else if (entry.isFile()) {
      if (IGNORED_FILES.has(entry.name)) continue;
      results.push(relativePath);
    }
  }
  return results;
}
function inferStackFromFiles(fileList: string[]): string {
  if (fileList.some((file: string) => file.includes('package.json'))) {
    if (fileList.some((file: string) => file.includes('next.config'))) return 'Next.js';
    if (fileList.some((file: string) => file.includes('remix.config'))) return 'Remix';
    if (fileList.some((file: string) => file.includes('svelte.config'))) return 'SvelteKit';
    return 'Node.js';
  }
  if (
    fileList.some(
      (file: string) => file.includes('pyproject.toml') || file.includes('requirements.txt')
    )
  ) {
    return 'Python';
  }
  return 'Unknown';
}
function classifyFilePaths(files: string[]): SyncClassification {
  const appFiles: string[] = [];
  const apiFiles: string[] = [];
  const schemaFiles: string[] = [];
  const configFiles: string[] = [];
  for (const file of files) {
    if (SCHEMA_PATTERNS.some((pattern) => pattern.test(file))) {
      schemaFiles.push(file);
      continue;
    }
    if (/^app\/api\//i.test(file) || /api\/.*\.(ts|js)$/i.test(file)) {
      apiFiles.push(file);
      continue;
    }
    if (/\.(tsx|jsx|svelte|vue)$/i.test(file) || /^app\//i.test(file)) {
      appFiles.push(file);
      continue;
    }
    if (/(config|\.config)\.(js|ts|json)$/i.test(file) || /\.(env|toml|yaml|yml)$/i.test(file)) {
      configFiles.push(file);
    }
  }
  return { appFiles, apiFiles, schemaFiles, configFiles };
}
function buildAutoSyncSection(summary: SyncSummary): string {
  const lines: string[] = [];
  lines.push(AUTO_SYNC_HEADER);
  lines.push('');
  lines.push(`- Last synced: ${summary.generatedAt}`);
  lines.push(`- Project root: ${summary.root}`);
  lines.push(`- Stack guess: ${summary.stack}`);
  lines.push(`- Total files scanned: ${summary.fileCount}`);
  lines.push(`- App/UI files: ${summary.appCount}`);
  lines.push(`- API files: ${summary.apiCount}`);
  lines.push(`- Schema files: ${summary.schemaCount}`);
  lines.push(`- Config files: ${summary.configCount}`);
  lines.push('');
  if (summary.appFiles.length > 0) {
    lines.push('### App/UI Files');
    lines.push(...summary.appFiles.map((file) => `- ${file}`));
    lines.push('');
  }
  if (summary.apiFiles.length > 0) {
    lines.push('### API Files');
    lines.push(...summary.apiFiles.map((file) => `- ${file}`));
    lines.push('');
  }
  if (summary.schemaFiles.length > 0) {
    lines.push('### Schema Files');
    lines.push(...summary.schemaFiles.map((file) => `- ${file}`));
    lines.push('');
  }
  if (summary.configFiles.length > 0) {
    lines.push('### Config Files');
    lines.push(...summary.configFiles.map((file) => `- ${file}`));
    lines.push('');
  }
  return lines.join('\n').trim();
}
function summarizeDiff(
  previous: Pick<SyncSummary, 'fileCount' | 'fileList'> | null,
  next: Pick<SyncSummary, 'fileCount' | 'fileList'>
): { added: number; removed: number } {
  if (!previous) {
    return {
      added: next.fileCount,
      removed: 0,
    };
  }
  const previousSet = new Set(previous.fileList || []);
  const nextSet = new Set(next.fileList || []);
  let added = 0;
  let removed = 0;
  for (const file of nextSet) {
    if (!previousSet.has(file)) added++;
  }
  for (const file of previousSet) {
    if (!nextSet.has(file)) removed++;
  }
  return { added, removed };
}
async function snapshotContext(rootDir: string): Promise<SnapshotResult> {
  const files = await listFilesRecursive(rootDir);
  const { appFiles, apiFiles, schemaFiles, configFiles } = classifyFilePaths(files);
  const summary: SyncSummary = {
    generatedAt: /* @__PURE__ */ new Date().toISOString(),
    root: rootDir,
    fileCount: files.length,
    appCount: appFiles.length,
    apiCount: apiFiles.length,
    schemaCount: schemaFiles.length,
    configCount: configFiles.length,
    appFiles: appFiles.slice(0, 25),
    apiFiles: apiFiles.slice(0, 25),
    schemaFiles: schemaFiles.slice(0, 25),
    configFiles: configFiles.slice(0, 25),
    stack: inferStackFromFiles(files),
    fileList: files,
  };
  const snapshotDir = path.join(rootDir, SNAPSHOT_DIR);
  await fs.mkdir(snapshotDir, { recursive: true });
  const snapshotPath = path.join(snapshotDir, SNAPSHOT_FILE);
  let previous: SyncSummary | null = null;
  try {
    const previousRaw = await fs.readFile(snapshotPath, 'utf-8');
    previous = JSON.parse(previousRaw) as SyncSummary;
  } catch {
    previous = null;
  }
  await fs.writeFile(snapshotPath, JSON.stringify(summary, null, 2));
  const contextPath = path.join(rootDir, 'CONTEXT.md');
  let contextContent = null;
  try {
    contextContent = await fs.readFile(contextPath, 'utf-8');
  } catch {
    return {
      summary,
      updated: false,
      missingContext: true,
      diff: summarizeDiff(previous, summary),
    };
  }
  const section = buildAutoSyncSection(summary);
  let updatedContext = contextContent;
  if (contextContent.includes(AUTO_SYNC_HEADER)) {
    const pattern = new RegExp(`${AUTO_SYNC_HEADER}[\\s\\S]*?(?=^##\\s|\\n##\\s|$)`, 'm');
    updatedContext = contextContent.replace(
      pattern,
      `${section}

`
    );
  } else {
    updatedContext = `${contextContent.trim()}

${section}
`;
  }
  if (updatedContext !== contextContent) {
    await fs.writeFile(contextPath, updatedContext);
    return {
      summary,
      updated: true,
      missingContext: false,
      diff: summarizeDiff(previous, summary),
    };
  }
  return {
    summary,
    updated: false,
    missingContext: false,
    diff: summarizeDiff(previous, summary),
  };
}
export { snapshotContext };
