// Copyright (c) 2026 Ultra-Dex

/**
 * Memory Entry Schema
 * Strict MemoryEntry interface with id, content, type, embedding, supersedes, relates_to
 */

import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Memory entry types
const MEMORY_TYPES = [
  'decision',
  'pattern',
  'error',
  'context',
  'code',
  'requirement',
  'solution',
  'bug_report',
  'fix',
  'architecture',
  'meeting_notes',
  'research',
  'conversation',
  'task',
  'knowledge',
  'experience',
];

// Validation functions
const validators = {
  id: (value) => typeof value === 'string' && value.length > 0,
  content: (value) => typeof value === 'string' && value.length > 0,
  type: (value) => MEMORY_TYPES.includes(value),
  embedding: (value) => Array.isArray(value) && value.every((v) => typeof v === 'number'),
  createdAt: (value) => value instanceof Date || typeof value === 'string',
  author: (value) => typeof value === 'string' && value.length > 0,
  tags: (value) => Array.isArray(value) && value.every((tag) => typeof tag === 'string'),
  supersedes: (value) =>
    value === null || (Array.isArray(value) && value.every((id) => typeof id === 'string')),
  relatesTo: (value) => Array.isArray(value) && value.every((id) => typeof id === 'string'),
};

// Default values
const DEFAULTS = {
  type: 'knowledge',
  embedding: [],
  tags: [],
  supersedes: [],
  relatesTo: [],
  author: 'system',
  metadata: {},
};

class MemoryEntry {
  constructor(data = {}) {
    const normalized = {
      ...data,
      relatesTo: data.relatesTo || data.relates_to,
    };

    // Generate ID if not provided
    this.id = normalized.id || this.generateId();

    // Validate and assign required fields
    this.content = this.validateField('content', normalized.content);
    this.type = this.validateField('type', normalized.type || DEFAULTS.type);

    // Assign optional fields with defaults
    this.embedding = this.validateField('embedding', normalized.embedding) || DEFAULTS.embedding;
    this.createdAt =
      this.validateField('createdAt', normalized.createdAt) || new Date().toISOString();
    this.author = this.validateField('author', normalized.author) || DEFAULTS.author;
    this.tags = this.validateField('tags', normalized.tags) || [...DEFAULTS.tags];
    this.supersedes = this.validateField('supersedes', normalized.supersedes) || [
      ...DEFAULTS.supersedes,
    ];
    this.relatesTo = this.validateField('relatesTo', normalized.relatesTo) || [
      ...DEFAULTS.relatesTo,
    ];
    this.metadata = normalized.metadata || DEFAULTS.metadata;

    // Add any additional fields
    Object.keys(normalized).forEach((key) => {
      if (
        ![
          'id',
          'content',
          'type',
          'embedding',
          'createdAt',
          'author',
          'tags',
          'supersedes',
          'relatesTo',
          'metadata',
        ].includes(key)
      ) {
        this[key] = normalized[key];
      }
    });
  }

  /**
   * Validate a field against its validator
   */
  validateField(fieldName, value) {
    if (!validators[fieldName]) {
      throw new Error(`Unknown field validator: ${fieldName}`);
    }

    if (value == null && fieldName !== 'supersedes' && fieldName !== 'relatesTo') {
      throw new Error(`Field '${fieldName}' is required`);
    }

    if (value != null && !validators[fieldName](value)) {
      throw new Error(`Invalid value for field '${fieldName}': ${JSON.stringify(value)}`);
    }

    return value;
  }

  /**
   * Generate a unique ID for the memory entry
   */
  generateId() {
    return `mem_${Date.now()}_${uuidv4().substring(0, 8)}`;
  }

  /**
   * Calculate a hash of the content for deduplication
   */
  getContentHash() {
    return createHash('sha256').update(this.content).digest('hex');
  }

  /**
   * Check if this entry supersedes another
   */
  supersedesEntry(otherEntryId) {
    return this.supersedes.includes(otherEntryId);
  }

  /**
   * Check if this entry relates to another
   */
  relatesToEntry(otherEntryId) {
    return this.relatesTo.includes(otherEntryId);
  }

  /**
   * Add a relation to another entry
   */
  addRelation(entryId) {
    if (!this.relatesTo.includes(entryId)) {
      this.relatesTo.push(entryId);
    }
  }

  /**
   * Remove a relation to another entry
   */
  removeRelation(entryId) {
    this.relatesTo = this.relatesTo.filter((id) => id !== entryId);
  }

  /**
   * Add a superseding relationship
   */
  supersedesEntryId(entryId) {
    if (!this.supersedes.includes(entryId)) {
      this.supersedes.push(entryId);
    }
  }

  /**
   * Add a tag
   */
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  /**
   * Remove a tag
   */
  removeTag(tag) {
    this.tags = this.tags.filter((t) => t !== tag);
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this.id,
      content: this.content,
      type: this.type,
      embedding: this.embedding,
      createdAt: this.createdAt,
      author: this.author,
      tags: this.tags,
      supersedes: this.supersedes,
      relatesTo: this.relatesTo,
      metadata: this.metadata,
      ...Object.fromEntries(
        Object.entries(this).filter(
          ([key]) =>
            ![
              'id',
              'content',
              'type',
              'embedding',
              'createdAt',
              'author',
              'tags',
              'supersedes',
              'relatesTo',
              'metadata',
            ].includes(key)
        )
      ),
    };
  }

  /**
   * Create a MemoryEntry from JSON
   */
  static fromJSON(json) {
    return new MemoryEntry(json);
  }

  /**
   * Validate the entire entry
   */
  validate() {
    const errors = [];

    // Validate required fields
    if (!validators.id(this.id)) errors.push('Invalid ID');
    if (!validators.content(this.content)) errors.push('Invalid content');
    if (!validators.type(this.type)) errors.push('Invalid type');
    if (!validators.createdAt(this.createdAt)) errors.push('Invalid createdAt');

    // Validate optional fields if present
    if (this.embedding && !validators.embedding(this.embedding)) errors.push('Invalid embedding');
    if (this.author && !validators.author(this.author)) errors.push('Invalid author');
    if (this.tags && !validators.tags(this.tags)) errors.push('Invalid tags');
    if (this.supersedes && !validators.supersedes(this.supersedes))
      errors.push('Invalid supersedes');
    if (this.relatesTo && !validators.relatesTo(this.relatesTo)) errors.push('Invalid relatesTo');

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a copy with updates
   */
  update(updates) {
    const newData = { ...this.toJSON(), ...updates };
    return new MemoryEntry(newData);
  }

  /**
   * Check similarity with another entry based on content hash
   */
  isSimilarTo(otherEntry, threshold = 0.9) {
    // This is a simplified similarity check
    // In a real implementation, you'd use the embedding vectors
    const thisHash = this.getContentHash();
    const otherHash = otherEntry.getContentHash();

    // Calculate similarity based on character differences
    let matches = 0;
    const minLength = Math.min(thisHash.length, otherHash.length);

    for (let i = 0; i < minLength; i++) {
      if (thisHash[i] === otherHash[i]) matches++;
    }

    const similarity = matches / minLength;
    return similarity >= threshold;
  }
}

// Memory entry factory
class MemoryEntryFactory {
  static create(data) {
    return new MemoryEntry(data);
  }

  static createDecision(content, author, additionalData = {}) {
    return new MemoryEntry({
      content,
      type: 'decision',
      author,
      ...additionalData,
    });
  }

  static createContext(content, author, additionalData = {}) {
    return new MemoryEntry({
      content,
      type: 'context',
      author,
      ...additionalData,
    });
  }

  static createCode(content, author, additionalData = {}) {
    return new MemoryEntry({
      content,
      type: 'code',
      author,
      ...additionalData,
    });
  }

  static createBugReport(content, author, additionalData = {}) {
    return new MemoryEntry({
      content,
      type: 'bug_report',
      author,
      ...additionalData,
    });
  }

  static createFix(content, author, additionalData = {}) {
    return new MemoryEntry({
      content,
      type: 'fix',
      author,
      ...additionalData,
    });
  }
}

/**
 * Register memory schema command
 */
export function registerMemorySchemaCommand(program) {
  program
    .command('memory-schema')
    .alias('mem-schema')
    .description('Memory entry schema and validation')
    .action(() => {
      console.log('🧠 Memory Entry Schema:');
      console.log('Required fields: id, content, type');
      console.log(
        'Optional fields: embedding, createdAt, author, tags, supersedes, relatesTo, metadata'
      );
      console.log('Valid types:', MEMORY_TYPES.join(', '));
    });
}

export default {
  MemoryEntry,
  MemoryEntryFactory,
  MEMORY_TYPES,
  validators,
  DEFAULTS,
  registerMemorySchemaCommand,
};
