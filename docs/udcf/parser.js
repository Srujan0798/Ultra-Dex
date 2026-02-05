import fs from 'fs';
import path from 'path';
import { validateUDCF } from './validator.js';

export function parseUDCF(input) {
  const doc = typeof input === 'string' ? JSON.parse(input) : input;
  const result = validateUDCF(doc);
  if (!result.valid) {
    const error = new Error(`Invalid UDCF document: ${result.errors.join(', ')}`);
    error.details = result.errors;
    throw error;
  }
  return doc;
}

export function parseUDCFFile(filePath) {
  const resolved = path.resolve(filePath);
  const content = fs.readFileSync(resolved, 'utf8');
  return parseUDCF(content);
}

export default {
  parseUDCF,
  parseUDCFFile
};
