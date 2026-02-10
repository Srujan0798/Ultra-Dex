// Copyright (c) 2026 Ultra-Dex

import { encode, decode } from 'gpt-tokenizer';
import { v4 as uuidv4 } from 'uuid';

/**
 * Context Compactor - Implements intelligent context compression
 * Features:
 * - Auto-compression at 95% token threshold
 * - Intelligent conversation summarization
 * - Preservation of "Sacred DNA" (34-section template)
 * - Optimization for 200k+ token window
 */
class ContextCompactor {
  /**
   * Initialize ContextCompactor
   * @param {Object} options - Configuration options
   * @param {number} [options.tokenThreshold=0.95] - Compression trigger ratio
   * @param {number} [options.maxTokens=200000] - Max context window size
   * @param {number} [options.sacredDNASections=34] - Number of critical sections to preserve
   */
  constructor(options = {}) {
    this.tokenThreshold = options.tokenThreshold || 0.95; // 95% threshold
    this.maxTokens = options.maxTokens || 200000; // 200k+ token window
    this.sacredDNASections = options.sacredDNASections || 34; // Number of sacred sections to preserve
    this.preservedContext = [];
    this.summaryHistory = [];
  }

  /**
   * Calculate total tokens in context
   * @param {Object|Array|string} context - The context to measure
   * @returns {number} Token count
   */
  calculateTokens(context) {
    const text = this.contextToString(context);
    return encode(text).length;
  }

  /**
   * Convert context object to string representation
   */
  contextToString(context) {
    if (typeof context === 'string') {
      return context;
    }

    if (Array.isArray(context)) {
      return context.map((item) => JSON.stringify(item)).join('\n');
    }

    return JSON.stringify(context, null, 2);
  }

  /**
   * Check if context exceeds threshold
   * @param {Object|Array|string} context - The context to check
   * @returns {boolean} True if compaction is needed
   */
  isAboveThreshold(context) {
    const currentTokens = this.calculateTokens(context);
    const threshold = this.maxTokens * this.tokenThreshold;
    return currentTokens > threshold;
  }

  /**
   * Extract and preserve Sacred DNA sections
   * @param {Object|Array} context - The context to process
   * @returns {Array<Object>} List of preserved sections
   */
  extractSacredDNA(context) {
    // Preserve the first N sections (Sacred DNA) that are critical
    const preserved = [];

    if (Array.isArray(context)) {
      // Look for sacred sections in the context array
      for (let i = 0; i < Math.min(this.sacredDNASections, context.length); i++) {
        if (this.isSacredSection(context[i])) {
          preserved.push({
            index: i,
            content: context[i],
            id: uuidv4(),
            preservedAt: Date.now(),
          });
        }
      }
    } else if (typeof context === 'object' && context !== null) {
      // Handle object-based context
      for (const [key, value] of Object.entries(context)) {
        if (this.isSacredSection(value)) {
          preserved.push({
            key,
            content: value,
            id: uuidv4(),
            preservedAt: Date.now(),
          });
        }
      }
    }

    this.preservedContext = [...this.preservedContext, ...preserved];
    return preserved;
  }

  /**
   * Determine if a section is part of the Sacred DNA
   */
  isSacredSection(section) {
    // Define criteria for what constitutes Sacred DNA
    // This could be based on keywords, structure, or metadata
    if (!section) return false;

    const sacredIndicators = [
      'SACRED_DNA',
      'CRITICAL_TEMPLATE',
      'TEMPLATE_SECTION',
      'CORE_REQUIREMENT',
      'ESSENTIAL_INFO',
      'PRESERVE_FOREVER',
      'UNTOUCHABLE',
      'IMMUTABLE',
      'FOUNDATION',
      'BASELINE',
      'ARCHITECTURE',
      'DESIGN_DECISION',
      'IMPLEMENTATION_PLAN',
      'REQUIREMENTS',
      'SPECIFICATIONS',
      'CONSTRAINTS',
      'LIMITATIONS',
      'INTERFACE_DEFINITION',
      'DATA_MODEL',
      'SCHEMA',
      'CONFIGURATION',
      'ENVIRONMENT_VARIABLES',
      'DEPLOYMENT_STRATEGY',
      'SECURITY_MEASURES',
      'PERFORMANCE_REQUIREMENTS',
      'TESTING_STRATEGY',
      'MONITORING',
      'ERROR_HANDLING',
      'BACKUP_STRATEGY',
      'RECOVERY_PROCEDURES',
      'AUDIT_LOGS',
      'COMPLIANCE_REQUIREMENTS',
      'ACCESS_CONTROLS',
      'VALIDATION_RULES',
    ];

    const text = typeof section === 'string' ? section : JSON.stringify(section);

    return sacredIndicators.some((indicator) => text.toUpperCase().includes(indicator));
  }

  /**
   * Summarize conversation intelligently
   * @param {Object|Array|string} conversation - The conversation to summarize
   * @returns {Promise<Object>} Summary data object
   */
  async summarizeConversation(conversation) {
    // This is a simplified version - in a real implementation,
    // this would use an LLM to generate intelligent summaries
    const summaryData = {
      id: uuidv4(),
      timestamp: Date.now(),
      originalLength: Array.isArray(conversation) ? conversation.length : 1,
      summary: '',
      compressionRatio: 0,
      preservedSections: 0,
    };

    if (Array.isArray(conversation) && conversation.length > 0) {
      // Create a summary of the conversation
      const messages = conversation.slice();

      // Extract key points from the conversation
      const keyPoints = this.extractKeyPoints(messages);

      // Count preserved sections
      const preservedSections = messages.filter((msg) => this.isSacredSection(msg)).length;
      summaryData.preservedSections = preservedSections;

      // Generate summary
      summaryData.summary = this.generateSummary(keyPoints, messages);
      summaryData.compressionRatio = keyPoints.length / messages.length;
    } else {
      summaryData.summary =
        typeof conversation === 'string'
          ? this.simpleSummarize(conversation)
          : this.simpleSummarize(JSON.stringify(conversation));
    }

    this.summaryHistory.push(summaryData);
    return summaryData;
  }

  /**
   * Extract key points from messages
   */
  extractKeyPoints(messages) {
    const keyPoints = [];
    const processedContent = new Set();

    for (const message of messages) {
      let content = '';

      if (typeof message === 'string') {
        content = message;
      } else if (typeof message === 'object' && message.content) {
        content = message.content;
      } else {
        content = JSON.stringify(message);
      }

      // Extract important segments
      const segments = this.splitIntoSegments(content);

      for (const segment of segments) {
        if (!processedContent.has(segment) && this.isKeyPoint(segment)) {
          keyPoints.push(segment);
          processedContent.add(segment);
        }
      }
    }

    return keyPoints;
  }

  /**
   * Split content into logical segments
   */
  splitIntoSegments(content) {
    // Split by paragraphs, sentences, or other logical boundaries
    if (typeof content !== 'string') return [JSON.stringify(content)];

    // Split by double newlines (paragraphs)
    const paragraphs = content.split(/\n\s*\n/);

    // Further split long paragraphs by sentences
    const segments = [];
    for (const paragraph of paragraphs) {
      if (paragraph.length > 500) {
        // Split long paragraphs into sentences
        const sentences = paragraph.match(/[^\.!?]+[\.!?]+/g) || [paragraph];
        segments.push(...sentences.map((s) => s.trim()).filter((s) => s.length > 0));
      } else {
        if (paragraph.trim().length > 0) {
          segments.push(paragraph.trim());
        }
      }
    }

    return segments;
  }

  /**
   * Determine if a segment is a key point worth preserving
   */
  isKeyPoint(segment) {
    if (typeof segment !== 'string') return false;

    // Key points typically contain important information
    const keyPointPatterns = [
      /(?:requirement|specification|constraint|limitation)/i,
      /(?:critical|essential|important|vital|crucial)/i,
      /(?:must|should|shall|will|need to)/i,
      /(?:error|issue|problem|bug|fix)/i,
      /(?:decision|agreement|conclusion)/i,
      /(?:design|architecture|structure)/i,
      /(?:template|format|schema|model)/i,
      /^\s*[A-Z][A-Z ]+[A-Z]\s*$/, // All caps headers
    ];

    return keyPointPatterns.some((pattern) => pattern.test(segment)) || segment.length > 20; // Longer segments are more likely to contain useful info
  }

  /**
   * Generate summary from key points
   */
  generateSummary(keyPoints, originalMessages) {
    const summaryParts = [
      `Conversation Summary (${keyPoints.length} key points extracted):`,
      '',
      ...keyPoints.map((point, index) => `${index + 1}. ${point}`),
    ];

    return summaryParts.join('\n');
  }

  /**
   * Simple summarization fallback
   */
  simpleSummarize(text) {
    if (typeof text !== 'string') {
      text = JSON.stringify(text);
    }

    // Return first and last parts of the text as a simple summary
    if (text.length < 500) return text;

    const firstPart = text.substring(0, 200);
    const lastPart = text.substring(text.length - 200);

    return `${firstPart}\n...\n[Content condensed]\n...\n${lastPart}`;
  }

  /**
   * Compact context when it exceeds the threshold
   * @param {Object|Array|string} context - The context to compact
   * @returns {Promise<Object>} Compaction result with stats
   */
  async compact(context) {
    const tokensBefore = this.calculateTokens(context);

    if (!this.isAboveThreshold(context)) {
      return {
        originalContext: context,
        compressed: false,
        tokensBefore: tokensBefore,
        tokensAfter: tokensBefore,
        compressionRatio: 1,
        preservedSections: [],
        summary: null,
        tokensSaved: 0,
      };
    }

    // Extract and preserve Sacred DNA sections first
    const preservedSections = this.extractSacredDNA(context);

    // Create a summary of the conversation
    const summary = await this.summarizeConversation(context);

    // Create compressed context
    let compressedContext;

    if (Array.isArray(context)) {
      // Process array-based context
      compressedContext = this.compressArrayContext(context, preservedSections);
    } else if (typeof context === 'object' && context !== null) {
      // Process object-based context
      compressedContext = this.compressObjectContext(context, preservedSections);
    } else {
      // Handle string-based context
      compressedContext = await this.compressStringContext(context, summary);
    }

    // Calculate final token counts
    let tokensAfter = this.calculateTokens(compressedContext);

    // If the compressed version is larger than original, try alternative approach
    // that only keeps the summary and preserved sections
    if (tokensAfter > tokensBefore) {
      // Create minimal compressed context with just summary and preserved sections
      if (Array.isArray(context)) {
        compressedContext = {
          summary: summary.summary,
          preservedSections: preservedSections.map((p) => p.content),
          type: 'compressed_context',
          originalTokens: tokensBefore,
          compressedTokens: tokensAfter,
        };
        tokensAfter = this.calculateTokens(compressedContext);
      }
    }

    const result = {
      originalContext: context,
      compressedContext,
      compressed: true,
      tokensBefore: tokensBefore,
      tokensAfter: tokensAfter,
      compressionRatio: tokensAfter / tokensBefore,
      tokensSaved: tokensBefore - tokensAfter,
      preservedSections,
      summary,
      timestamp: Date.now(),
    };

    return result;
  }

  /**
   * Compress array-based context
   */
  compressArrayContext(context, preservedSections) {
    // Create a copy of the context
    const compressed = [...context];

    // Remove elements that were preserved separately
    const preservedIndices = preservedSections.map((p) => p.index).filter((i) => i !== undefined);

    // Filter out preserved elements from the main context
    // (they will be added back in a structured way)
    let filteredContext = compressed.filter((_, index) => !preservedIndices.includes(index));

    // Apply intelligent reduction to remaining elements
    const reducedContext = this.intelligentlyReduce(filteredContext);

    // Combine preserved sections with reduced context
    // Only add preserved sections if they don't increase token count too much
    if (preservedSections.length > 0) {
      return {
        preservedSections: preservedSections.map((p) => p.content),
        compressedContent: reducedContext,
        summary: this.summaryHistory[this.summaryHistory.length - 1]?.summary || '',
      };
    } else {
      return reducedContext;
    }
  }

  /**
   * Compress object-based context
   */
  compressObjectContext(context, preservedSections) {
    const compressed = { ...context };

    // Remove preserved keys from the main object
    for (const preserved of preservedSections) {
      if (preserved.key) {
        delete compressed[preserved.key];
      }
    }

    // Apply intelligent reduction to remaining properties
    const reducedObject = this.intelligentlyReduceObject(compressed);

    // Combine preserved sections with reduced object
    return {
      preservedSections,
      compressedContent: reducedObject,
      summary: this.summaryHistory[this.summaryHistory.length - 1]?.summary || '',
    };
  }

  /**
   * Compress string-based context
   */
  async compressStringContext(context, summary) {
    // For string context, return the summary along with original if it's critical
    return {
      original: context,
      summary: summary.summary,
      compressed: true,
    };
  }

  /**
   * Intelligently reduce array elements
   */
  intelligentlyReduce(array) {
    if (array.length <= 10) return array; // Don't compress small arrays

    // Identify and preserve Sacred DNA sections
    const sacredItems = array.filter((item) => this.isSacredSection(item));

    // Get non-sacred items for reduction
    const nonSacredItems = array.filter((item) => !this.isSacredSection(item));

    if (nonSacredItems.length <= 10) {
      // If there aren't many non-sacred items, return original with sacred items
      return [...sacredItems, ...nonSacredItems];
    }

    // Keep the most recent non-sacred items and some key historical items
    const recentCount = Math.floor(nonSacredItems.length * 0.3); // Keep 30% recent
    const sampleCount = Math.min(Math.floor(nonSacredItems.length * 0.2), 10); // Sample 20% or max 10 older items

    const recentItems = nonSacredItems.slice(-recentCount);
    const sampledItems = [];

    // Evenly sample from the earlier parts of the non-sacred items
    if (nonSacredItems.length - recentCount > sampleCount) {
      const step = Math.floor((nonSacredItems.length - recentCount) / sampleCount);
      for (let i = 0; i < sampleCount && i * step < nonSacredItems.length - recentCount; i++) {
        sampledItems.push(nonSacredItems[i * step]);
      }
    } else {
      // If not enough items to sample, take what's available
      sampledItems.push(...nonSacredItems.slice(0, nonSacredItems.length - recentCount));
    }

    return [...sacredItems, ...sampledItems, ...recentItems];
  }

  /**
   * Intelligently reduce object properties
   */
  intelligentlyReduceObject(obj) {
    const keys = Object.keys(obj);
    if (keys.length <= 10) return obj; // Don't compress small objects

    // For now, return the object as is, but in a real implementation
    // we would apply intelligent property selection
    return obj;
  }

  /**
   * Get compression statistics
   */
  getStats() {
    const totalTokensSaved = this.summaryHistory.reduce((sum, s) => s.tokensSaved || 0, 0);
    const avgCompressionRatio =
      this.summaryHistory.length > 0
        ? this.summaryHistory.reduce((sum, s) => sum + s.compressionRatio, 0) /
        this.summaryHistory.length
        : 0;

    return {
      totalCompactions: this.summaryHistory.length,
      preservedSectionsCount: this.preservedContext.length,
      avgCompressionRatio: avgCompressionRatio,
      currentTokenThreshold: this.tokenThreshold,
      maxTokenWindow: this.maxTokens,
      totalTokensSaved: totalTokensSaved,
      efficiencyRate:
        this.summaryHistory.length > 0
          ? totalTokensSaved /
          (this.summaryHistory.reduce((sum, s) => sum.tokensBefore || 0, 0) || 1)
          : 0,
    };
  }

  /**
   * Check if context needs immediate compaction
   */
  needsCompaction(context) {
    const currentTokens = this.calculateTokens(context);
    const threshold = this.maxTokens * this.tokenThreshold;
    const buffer = this.maxTokens * 0.02; // 2% buffer to avoid getting too close to limit

    return currentTokens > threshold - buffer;
  }

  /**
   * Perform adaptive compaction based on context characteristics
   */
  async adaptiveCompact(context) {
    if (!this.needsCompaction(context)) {
      return {
        originalContext: context,
        compressed: false,
        reason: 'Below compaction threshold',
      };
    }

    // Determine the best compaction strategy based on context type
    if (Array.isArray(context) && context.length > 100) {
      // For large arrays, use aggressive compaction
      return await this.aggressiveCompact(context);
    } else {
      // For smaller contexts, use standard compaction
      return await this.compact(context);
    }
  }

  /**
   * Aggressive compaction for very large contexts
   * @param {Object|Array|string} context - The context to compact aggressively
   * @returns {Promise<Object>} Access compaction result
   */
  async aggressiveCompact(context) {
    // Extract and preserve Sacred DNA sections first
    const preservedSections = this.extractSacredDNA(context);

    // Create a more aggressive summary
    const summary = await this.summarizeConversation(context);

    // For aggressive compaction, we'll create a much more condensed version
    let compressedContext;

    if (Array.isArray(context)) {
      // Take only the most recent 20% of items plus preserved sections
      const recentCount = Math.max(5, Math.floor(context.length * 0.2));
      const recentItems = context.slice(-recentCount);

      compressedContext = {
        type: 'aggressively_compressed',
        summary: summary.summary,
        preservedSections: preservedSections.map((p) => p.content),
        recentItems: recentItems,
        originalLength: context.length,
        compressedLength: recentCount + preservedSections.length,
      };
    } else {
      compressedContext = await this.compact(context);
    }

    const tokensBefore = this.calculateTokens(context);
    const tokensAfter = this.calculateTokens(compressedContext);

    return {
      originalContext: context,
      compressedContext,
      compressed: true,
      tokensBefore,
      tokensAfter,
      compressionRatio: tokensAfter / Math.max(tokensBefore, 1),
      tokensSaved: tokensBefore - tokensAfter,
      preservedSections,
      summary,
      strategy: 'aggressive',
      timestamp: Date.now(),
    };
  }
}

export { ContextCompactor };

/**
 * Safe execution wrapper with error handling for compactor
 * @param {Function} fn - Async function to execute
 * @param {string} [context='compactor'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'compactor') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
