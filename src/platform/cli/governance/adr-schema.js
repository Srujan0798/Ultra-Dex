// Copyright (c) 2026 Ultra-Dex

/**
 * ADR Schema Definition
 * Architecture Decision Record schema for governance
 */

export const ADR_SCHEMA = {
  type: 'object',
  required: ['id', 'title', 'status', 'date', 'decidedBy'],
  properties: {
    id: {
      type: 'string',
      pattern: '^ADR-\\d{3}$',
      description: 'ADR identifier in format ADR-XXX'
    },
    title: {
      type: 'string',
      minLength: 10,
      maxLength: 100,
      description: 'Clear, descriptive title of the decision'
    },
    status: {
      type: 'string',
      enum: ['accepted', 'deprecated', 'superseded'],
      description: 'Current status of the decision'
    },
    date: {
      type: 'string',
      format: 'date',
      description: 'Date when decision was made'
    },
    decidedBy: {
      type: 'string',
      description: 'Person/team who made the decision'
    },
    context: {
      type: 'string',
      description: 'The context that necessitated the decision'
    },
    decision: {
      type: 'string',
      description: 'The decision that was made'
    },
    consequences: {
      type: 'object',
      properties: {
        positive: {
          type: 'array',
          items: { type: 'string' }
        },
        negative: {
          type: 'array',
          items: { type: 'string' }
        },
        neutral: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    },
    affectedPaths: {
      type: 'array',
      items: { type: 'string' },
      description: 'File paths affected by this decision'
    },
    constraints: {
      type: 'array',
      items: { type: 'string' },
      description: 'Technical or business constraints'
    },
    alternatives: {
      type: 'array',
      items: {
        type: 'object',
        required: ['option', 'pros', 'cons'],
        properties: {
          option: { type: 'string' },
          pros: { type: 'array', items: { type: 'string' } },
          cons: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }
};

/**
 * Validate an ADR record against the schema
 */
export function validateADR(adr) {
  const errors = [];
  
  // Check required fields
  const requiredFields = ['id', 'title', 'status', 'date', 'decidedBy'];
  for (const field of requiredFields) {
    if (!adr[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate ID format
  if (adr.id && !/^ADR-\d{3}$/.test(adr.id)) {
    errors.push('ID must follow format ADR-XXX where XXX is a 3-digit number');
  }
  
  // Validate status
  if (adr.status && !['accepted', 'deprecated', 'superseded'].includes(adr.status)) {
    errors.push('Status must be one of: accepted, deprecated, superseded');
  }
  
  // Validate title length
  if (adr.title && (adr.title.length < 10 || adr.title.length > 100)) {
    errors.push('Title must be between 10 and 100 characters');
  }
  
  // Validate date format
  if (adr.date) {
    const date = new Date(adr.date);
    if (isNaN(date.getTime())) {
      errors.push('Date must be a valid date string');
    }
  }
  
  // Validate affectedPaths and constraints are arrays
  if (adr.affectedPaths && !Array.isArray(adr.affectedPaths)) {
    errors.push('affectedPaths must be an array of file paths');
  }
  
  if (adr.constraints && !Array.isArray(adr.constraints)) {
    errors.push('constraints must be an array of constraint strings');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a new ADR record
 */
export function createADR(data) {
  const validation = validateADR(data);
  
  if (!validation.valid) {
    throw new Error(`Invalid ADR: ${validation.errors.join(', ')}`);
  }
  
  return {
    id: data.id,
    title: data.title,
    status: data.status,
    date: data.date,
    decidedBy: data.decidedBy,
    context: data.context || '',
    decision: data.decision || '',
    consequences: {
      positive: data.consequences?.positive || [],
      negative: data.consequences?.negative || [],
      neutral: data.consequences?.neutral || []
    },
    affectedPaths: data.affectedPaths || [],
    constraints: data.constraints || [],
    alternatives: data.alternatives || []
  };
}

/**
 * Update an existing ADR record
 */
export function updateADR(existingADR, updates) {
  const updated = { ...existingADR, ...updates };
  const validation = validateADR(updated);
  
  if (!validation.valid) {
    throw new Error(`Invalid ADR update: ${validation.errors.join(', ')}`);
  }
  
  return updated;
}

/**
 * Check if a file path is affected by an ADR
 */
export function isPathAffectedByADR(adr, filePath) {
  if (!adr.affectedPaths || !Array.isArray(adr.affectedPaths)) {
    return false;
  }
  
  // Check if the file path matches any of the affected paths
  // Support both exact matches and glob patterns
  return adr.affectedPaths.some(affectedPath => {
    if (affectedPath === filePath) {
      return true;
    }
    
    // For glob pattern matching, we'd need a glob library
    // For now, just do simple path matching
    if (affectedPath.endsWith('*')) {
      const basePath = affectedPath.slice(0, -1);
      return filePath.startsWith(basePath);
    }
    
    return false;
  });
}

/**
 * Check if an ADR is active (not deprecated or superseded)
 */
export function isActiveADR(adr) {
  return adr.status === 'accepted';
}

/**
 * Find ADRs that affect a specific file path
 */
export function findADRsForPath(adrs, filePath) {
  return adrs.filter(adr => isPathAffectedByADR(adr, filePath) && isActiveADR(adr));
}

/**
 * Find ADRs that match specific constraints
 */
export function findADRsByConstraints(adrs, constraints) {
  return adrs.filter(adr => 
    adr.constraints && 
    Array.isArray(adr.constraints) && 
    constraints.some(constraint => 
      adr.constraints.some(adrConstraint => 
        adrConstraint.toLowerCase().includes(constraint.toLowerCase())
      )
    )
  );
}

export default {
  ADR_SCHEMA,
  validateADR,
  createADR,
  updateADR,
  isPathAffectedByADR,
  isActiveADR,
  findADRsForPath,
  findADRsByConstraints
};

/**
 * Handle errors in adr-schema module
 * @param {Error} error - The error to handle
 * @param {string} [context='adr-schema'] - Error context
 */
function handleModuleError(error, context = 'adr-schema') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
