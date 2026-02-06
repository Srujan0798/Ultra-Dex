/**
 * Governance Schema & Validation (v4.1)
 * Manages Architectural Decision Records (ADRs)
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

export const ADRSchema = z.object({
  id: z.string().describe("Unique identifier (e.g., ADR-001)"),
  title: z.string().describe("Title of the decision"),
  status: z.enum(['proposed', 'active', 'deprecated', 'superseded']),
  patterns: z.array(z.string()).describe("Regex patterns to check for violations"),
  enforcement: z.enum(['strict', 'warning', 'info']).default('strict'),
  rationale: z.string().optional(),
  date: z.string().optional()
});

export const ADRIndexSchema = z.array(ADRSchema);

const ADR_PATH = path.resolve(process.cwd(), '.ultra-dex/adrs.json');

/**
 * Load the ADR Index
 */
export async function loadADRs() {
  try {
    const data = await fs.readFile(ADR_PATH, 'utf8');
    return ADRIndexSchema.parse(JSON.parse(data));
  } catch (error) {
    return [];
  }
}

/**
 * Save an ADR to the index
 */
export async function saveADR(adr) {
  const current = await loadADRs();
  const validADR = ADRSchema.parse(adr);
  
  const index = current.findIndex(a => a.id === validADR.id);
  if (index !== -1) {
    current[index] = validADR;
  } else {
    current.push(validADR);
  }

  await fs.mkdir(path.dirname(ADR_PATH), { recursive: true });
  await fs.writeFile(ADR_PATH, JSON.stringify(current, null, 2));
  return validADR;
}
