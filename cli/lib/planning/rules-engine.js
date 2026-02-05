import fs from 'fs/promises';
import path from 'path';

const RULES_PATH = path.resolve(process.cwd(), '.ultra-dex', 'rules.json');

export async function loadRules() {
  try {
    const content = await fs.readFile(RULES_PATH, 'utf8');
    return JSON.parse(content);
  } catch {
    return { rules: [] };
  }
}

export function evaluateRules(planText, rules = []) {
  const violations = [];
  for (const rule of rules) {
    if (rule.if && rule.then) {
      if (planText.includes(rule.if) && rule.then.includes('block')) {
        violations.push(rule);
      }
    }
  }
  return violations;
}

export default {
  loadRules,
  evaluateRules
};
