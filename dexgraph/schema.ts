import { WorkflowDefinition, TaskDefinition, VerificationRule } from './types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateWorkflow(def: any): ValidationResult {
  const errors: string[] = [];

  // 1. Version check
  if (!def || def.version !== 'dexgraph/v1') {
    errors.push(`Invalid version "${def?.version}". Expected "dexgraph/v1"`);
  }

  // 2. Name check
  if (!def?.name || typeof def.name !== 'string') {
    errors.push('Missing or invalid required field: "name"');
  }

  // 3. Tasks existence and type check
  if (!def?.tasks || !Array.isArray(def.tasks)) {
    errors.push('Missing or invalid required field: "tasks" (must be an array)');
  } else if (def.tasks.length === 0) {
    errors.push('Field "tasks" must contain at least one task');
  } else {
    // 4. Validate each task
    const seenIds = new Set<string>();
    const validRoles = ['architect', 'engineer', 'tester', 'reviewer'];
    const validVerifyTypes = ['unit_test', 'llm_check', 'file_exists', 'custom'];

    def.tasks.forEach((task: any, index: number) => {
      const taskId = task?.id || `index_${index}`;

      // Task ID
      if (!task?.id || typeof task.id !== 'string') {
        errors.push(`Task at index ${index} is missing a valid "id"`);
      } else if (seenIds.has(task.id)) {
        errors.push(`Duplicate task ID found: "${task.id}"`);
      } else {
        seenIds.add(task.id);
      }

      // Role
      if (!task?.role || !validRoles.includes(task.role)) {
        errors.push(`Task "${taskId}" has an invalid role "${task?.role}". Must be one of: ${validRoles.join(', ')}`);
      }

      // Instruction
      if (!task?.instruction || typeof task.instruction !== 'string') {
        errors.push(`Task "${taskId}" is missing a valid "instruction"`);
      }

      // Verification
      if (task?.verify) {
        if (!task.verify.type || !validVerifyTypes.includes(task.verify.type)) {
          errors.push(`Task "${taskId}" has an invalid verify type "${task.verify.type}". Must be one of: ${validVerifyTypes.join(', ')}`);
        }
      }

      // depends_on
      if (task?.depends_on !== undefined) {
        if (!Array.isArray(task.depends_on)) {
          errors.push(`Task "${taskId}": "depends_on" must be an array`);
        } else {
          // Self-dependency check
          if (task.id && task.depends_on.includes(task.id)) {
            errors.push(`Task "${taskId}" cannot depend on itself`);
          }
          // Each dep must be a string
          for (const dep of task.depends_on) {
            if (typeof dep !== 'string') {
              errors.push(`Task "${taskId}": each dependency in "depends_on" must be a string`);
            }
          }
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
