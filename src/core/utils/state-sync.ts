import fs from 'fs/promises';
import path from 'path';
import { loadState, saveState, parsePlanFromMarkdown, generateMarkdown } from '../commands/plan.js';
async function syncState(): Promise<{ source: 'markdown' | 'json'; target: 'json' | 'markdown' } | null> {
  const projectRoot = process.cwd();
  const statePath = path.resolve(projectRoot, '.ultra/state.json');
  const planPath = path.resolve(projectRoot, 'IMPLEMENTATION-PLAN.md');
  let stateMtime = 0;
  let planMtime = 0;
  try {
    const stateStat = await fs.stat(statePath);
    stateMtime = stateStat.mtimeMs;
  } catch (_e) {}
  try {
    const planStat = await fs.stat(planPath);
    planMtime = planStat.mtimeMs;
  } catch (_e) {}
  if (stateMtime === 0 && planMtime === 0) return null;
  if (planMtime > stateMtime) {
    const phases = await parsePlanFromMarkdown();
    if (phases.length > 0) {
      let state = await loadState();
      if (!state) {
        state = {
          project: { name: path.basename(projectRoot), mode: 'ULTRA_MODE' },
          updatedAt: /* @__PURE__ */ new Date().toISOString(),
        };
      }
      state.phases = phases;
      state.updatedAt = /* @__PURE__ */ new Date().toISOString();
      await saveState(state);
      return { source: 'markdown', target: 'json' };
    }
  } else {
    const state = await loadState();
    if (state && state.phases) {
      const markdown = generateMarkdown(state);
      await fs.writeFile(planPath, markdown);
      return { source: 'json', target: 'markdown' };
    }
  }
  return null;
}
async function syncJsonToMarkdown(): Promise<boolean> {
  const state = await loadState();
  if (state && state.phases) {
    const markdown = generateMarkdown(state);
    await fs.writeFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), markdown);
    return true;
  }
  return false;
}
async function syncMarkdownToJson(): Promise<boolean> {
  const phases = await parsePlanFromMarkdown();
  if (phases.length > 0) {
    const state = await loadState();
    if (state) {
      state.phases = phases;
      state.updatedAt = /* @__PURE__ */ new Date().toISOString();
      await saveState(state);
      return true;
    }
  }
  return false;
}
export { syncJsonToMarkdown, syncMarkdownToJson, syncState };
