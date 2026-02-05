import fs from 'fs';
import path from 'path';

const REQUIRED_FIELDS = ['project', 'context', 'architecture', 'decisions', 'tasks', 'metadata'];

export function validateUDCF(doc) {
  const errors = [];
  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: ['Document must be an object'] };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in doc)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (doc.project && typeof doc.project.name !== 'string') {
    errors.push('project.name must be a string');
  }

  if (doc.decisions && !Array.isArray(doc.decisions)) {
    errors.push('decisions must be an array');
  }

  if (doc.tasks && !Array.isArray(doc.tasks)) {
    errors.push('tasks must be an array');
  }

  return { valid: errors.length === 0, errors };
}

export function validateUDCFFile(filePath) {
  const resolved = path.resolve(filePath);
  const content = fs.readFileSync(resolved, 'utf8');
  const parsed = JSON.parse(content);
  return validateUDCF(parsed);
}

export default {
  validateUDCF,
  validateUDCFFile
};
