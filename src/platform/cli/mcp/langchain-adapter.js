// Copyright (c) 2026 Ultra-Dex

/**
 * LangChain Adapter
 * Bridge Ultra-Dex tools to LangChain ecosystem
 */

import { Tool } from 'langchain/tools';
import { z } from 'zod';
import chalk from 'chalk';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

/**
 * Base Ultra-Dex Tool Definition
 */
class UltraDexTool {
  constructor({ name, description, schema, execute, category = 'general' }) {
    this.name = name;
    this.description = description;
    this.schema = schema; // Zod schema
    this.execute = execute; // Function to execute the tool
    this.category = category; // Category for organization
    this.createdAt = new Date().toISOString();
  }

  /**
   * Validate input against schema
   */
  validateInput(input) {
    try {
      return this.schema.parse(input);
    } catch (error) {
      throw new Error(`Input validation failed: ${error.errors?.map(e => e.message).join(', ')}`);
    }
  }

  /**
   * Execute the tool with validation
   */
  async run(input) {
    const validatedInput = this.validateInput(input);
    return await this.execute(validatedInput);
  }
}

/**
 * LangChain Tool Adapter
 */
class LangChainToolAdapter extends Tool {
  constructor(ultraDexTool) {
    super();

    this.ultraDexTool = ultraDexTool;
    this.name = ultraDexTool.name;
    this.description = ultraDexTool.description;
  }

  /**
   * LangChain tool schema (converted from Zod to LangChain format)
   */
  get schema() {
    // Convert Zod schema to LangChain format
    return this.convertZodToLangChainSchema(this.ultraDexTool.schema);
  }

  /**
   * Convert Zod schema to LangChain format
   */
  convertZodToLangChainSchema(zodSchema) {
    if (zodSchema._def?.typeName === 'ZodObject') {
      const shape = zodSchema.shape;
      const properties = {};
      const required = [];

      for (const [key, value] of Object.entries(shape)) {
        properties[key] = this.convertZodTypeToLangChain(value);

        // Check if field is required (not optional)
        if (!(value._def?.typeName === 'ZodOptional')) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required
      };
    }

    return zodSchema;
  }

  /**
   * Convert individual Zod type to LangChain format
   */
  convertZodTypeToLangChain(zodType) {
    const def = zodType._def;

    switch (def.typeName) {
      case 'ZodString':
        return { type: 'string', description: def.description };
      case 'ZodNumber':
        return { type: 'number', description: def.description };
      case 'ZodBoolean':
        return { type: 'boolean', description: def.description };
      case 'ZodArray':
        return {
          type: 'array',
          items: this.convertZodTypeToLangChain(def.type),
          description: def.description
        };
      case 'ZodObject':
        return this.convertZodToLangChainSchema(def.schema);
      case 'ZodOptional':
        return this.convertZodTypeToLangChain(def.innerType);
      default:
        return { type: 'string', description: def.description || 'Unknown type' };
    }
  }

  /**
   * LangChain tool execution method
   */
  async _call(input) {
    try {
      printInfo(chalk.gray(`LangChain adapter calling: ${this.name}`));
      const result = await this.ultraDexTool.run(input);
      printSuccess(chalk.green(`LangChain tool ${this.name} executed successfully`));
      return JSON.stringify(result);
    } catch (error) {
      printError(`LangChain tool ${this.name} failed: ${error.message}`);
      throw error;
    }
  }
}

/**
 * LangChain Adapter Manager
 */
class LangChainAdapterManager {
  constructor() {
    this.ultraDexTools = new Map(); // Ultra-Dex tools
    this.langchainTools = new Map(); // Converted LangChain tools
    this.adapters = new Map(); // Adapter instances
  }

  /**
   * Register an Ultra-Dex tool
   */
  registerUltraDexTool(tool) {
    if (!(tool instanceof UltraDexTool)) {
      throw new Error('Tool must be an instance of UltraDexTool');
    }

    this.ultraDexTools.set(tool.name, tool);
    printSuccess(chalk.green(`✅ Registered Ultra-Dex tool: ${tool.name}`));
  }

  /**
   * Create a LangChain adapter for an Ultra-Dex tool
   */
  createLangChainAdapter(toolName) {
    const ultraDexTool = this.ultraDexTools.get(toolName);
    if (!ultraDexTool) {
      throw new Error(`Ultra-Dex tool not found: ${toolName}`);
    }

    const adapter = new LangChainToolAdapter(ultraDexTool);
    this.adapters.set(toolName, adapter);
    this.langchainTools.set(toolName, adapter);

    printSuccess(chalk.green(`✅ Created LangChain adapter for: ${toolName}`));
    return adapter;
  }

  /**
   * Get a LangChain tool by name
   */
  getLangChainTool(toolName) {
    return this.langchainTools.get(toolName);
  }

  /**
   * Get all LangChain tools
   */
  getAllLangChainTools() {
    return Array.from(this.langchainTools.values());
  }

  /**
   * Batch register multiple Ultra-Dex tools
   */
  registerUltraDexTools(tools) {
    for (const tool of tools) {
      this.registerUltraDexTool(tool);
    }
  }

  /**
   * Batch create adapters for multiple tools
   */
  createLangChainAdapters(toolNames) {
    return toolNames.map(name => this.createLangChainAdapter(name));
  }

  /**
   * Create adapters for all registered Ultra-Dex tools
   */
  createAllAdapters() {
    const adapters = [];
    for (const [name] of this.ultraDexTools) {
      adapters.push(this.createLangChainAdapter(name));
    }
    return adapters;
  }

  /**
   * Convert Ultra-Dex tools to LangChain tools
   */
  ultraDexToLangChain(ultraDexTools) {
    return ultraDexTools.map(tool => new LangChainToolAdapter(tool));
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category) {
    const ultraDexTools = Array.from(this.ultraDexTools.values())
      .filter(tool => tool.category === category);

    return ultraDexTools.map(tool => this.getLangChainTool(tool.name))
      .filter(Boolean);
  }

  /**
   * Validate tool compatibility
   */
  validateCompatibility(tool) {
    // Check if the tool has required properties
    const requiredProps = ['name', 'description', 'execute'];
    const missingProps = requiredProps.filter(prop => !tool[prop]);

    if (missingProps.length > 0) {
      throw new Error(`Tool missing required properties: ${missingProps.join(', ')}`);
    }

    // Check if execute is a function
    if (typeof tool.execute !== 'function') {
      throw new Error('Tool execute property must be a function');
    }

    // Check if schema is a valid Zod schema
    if (tool.schema && typeof tool.schema.parse !== 'function') {
      throw new Error('Tool schema must be a Zod schema with a parse method');
    }

    return true;
  }

  /**
   * Bulk validate tools
   */
  validateTools(tools) {
    const results = [];

    for (const tool of tools) {
      try {
        this.validateCompatibility(tool);
        results.push({ tool: tool.name, valid: true });
      } catch (error) {
        results.push({ tool: tool.name, valid: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get adapter statistics
   */
  getStats() {
    return {
      ultraDexTools: this.ultraDexTools.size,
      langchainTools: this.langchainTools.size,
      adapters: this.adapters.size,
      categories: [...new Set(Array.from(this.ultraDexTools.values()).map(t => t.category))]
    };
  }

  /**
   * Export tools for LangChain agent usage
   */
  exportForLangChain(options = {}) {
    const tools = this.getAllLangChainTools();

    // Filter by category if specified
    if (options.categories) {
      const categorySet = new Set(options.categories);
      return tools.filter(tool => categorySet.has(this.ultraDexTools.get(tool.name)?.category));
    }

    // Filter by name if specified
    if (options.names) {
      const nameSet = new Set(options.names);
      return tools.filter(tool => nameSet.has(tool.name));
    }

    return tools;
  }

  /**
   * Import tools from LangChain format (reverse mapping)
   */
  importFromLangChain(langchainTools) {
    const ultraDexTools = [];

    for (const lcTool of langchainTools) {
      const ultraDexTool = new UltraDexTool({
        name: lcTool.name,
        description: lcTool.description,
        // Create a basic schema based on LangChain tool format
        schema: this.createSchemaFromLangChainFormat(lcTool.schema),
        execute: async (input) => {
          // Convert the tool execution to match LangChain's format
          return await lcTool._call(input);
        },
        category: 'imported'
      });

      this.registerUltraDexTool(ultraDexTool);
      ultraDexTools.push(ultraDexTool);
    }

    return ultraDexTools;
  }

  /**
   * Create Zod schema from LangChain format
   */
  createSchemaFromLangChainFormat(lcSchema) {
    if (!lcSchema || !lcSchema.properties) {
      // Return a basic schema if no properties defined
      return z.object({});
    }

    const shape = {};

    for (const [key, value] of Object.entries(lcSchema.properties)) {
      let zodType;

      switch (value.type) {
        case 'string':
          zodType = z.string();
          break;
        case 'number':
          zodType = z.number();
          break;
        case 'boolean':
          zodType = z.boolean();
          break;
        case 'array':
          zodType = z.array(this.createSchemaFromLangChainType(value.items));
          break;
        case 'object':
          zodType = this.createSchemaFromLangChainFormat(value);
          break;
        default:
          zodType = z.string();
      }

      if (value.description) {
        zodType = zodType.describe(value.description);
      }

      // Make optional if not in required array
      if (lcSchema.required && !lcSchema.required.includes(key)) {
        zodType = zodType.optional();
      }

      shape[key] = zodType;
    }

    return z.object(shape);
  }

  /**
   * Create Zod type from LangChain type definition
   */
  createSchemaFromLangChainType(lcType) {
    switch (lcType.type) {
      case 'string':
        return lcType.description ? z.string().describe(lcType.description) : z.string();
      case 'number':
        return lcType.description ? z.number().describe(lcType.description) : z.number();
      case 'boolean':
        return lcType.description ? z.boolean().describe(lcType.description) : z.boolean();
      case 'object':
        return this.createSchemaFromLangChainFormat(lcType);
      default:
        return z.string();
    }
  }

  /**
   * Sync tool status between Ultra-Dex and LangChain
   */
  async syncToolStatus() {
    const stats = this.getStats();
    printInfo(chalk.cyan(`\n🔄 Syncing tool status...`));
    printInfo(chalk.gray(`Ultra-Dex Tools: ${stats.ultraDexTools}`));
    printInfo(chalk.gray(`LangChain Adapters: ${stats.langchainTools}`));
    printInfo(chalk.gray(`Categories: ${stats.categories.join(', ')}`));

    // In a real implementation, this would sync status between systems
    // For now, just return the stats
    return stats;
  }

  /**
   * Get tool usage analytics
   */
  getToolAnalytics() {
    // This would track usage in a real implementation
    // For now, return mock analytics
    return {
      totalExecutions: 0,
      successRate: 100,
      avgExecutionTime: 0,
      mostUsed: [],
      leastUsed: []
    };
  }

  /**
   * Create a tool execution wrapper with error handling and logging
   */
  createWrappedToolExecutor(toolName) {
    const adapter = this.getLangChainTool(toolName);
    if (!adapter) {
      throw new Error(`LangChain tool not found: ${toolName}`);
    }

    return async (input, options = {}) => {
      printInfo(chalk.gray(`Executing tool: ${toolName}`));

      try {
        const startTime = Date.now();
        const result = await adapter._call(input);
        const executionTime = Date.now() - startTime;

        printSuccess(chalk.green(`✅ Tool ${toolName} executed in ${executionTime}ms`));

        // Log execution if requested
        if (options.logExecution) {
          this.logToolExecution(toolName, input, result, executionTime);
        }

        return result;
      } catch (error) {
        printError(`❌ Tool ${toolName} failed: ${error.message}`);

        // Log error if requested
        if (options.logErrors) {
          this.logToolError(toolName, input, error);
        }

        throw error;
      }
    };
  }

  /**
   * Log tool execution
   */
  logToolExecution(toolName, input, result, executionTime) {
    // In a real implementation, this would log to a persistent store
    printInfo(chalk.gray(`📊 Tool execution logged: ${toolName} (${executionTime}ms)`));
  }

  /**
   * Log tool error
   */
  logToolError(toolName, input, error) {
    // In a real implementation, this would log errors to a persistent store
    printWarning(chalk.yellow(`⚠️  Tool error logged: ${toolName} - ${error.message}`));
  }

  /**
   * Get tool recommendations based on context
   */
  getToolRecommendations(context, options = {}) {
    // Analyze context to recommend relevant tools
    const allTools = this.getAllLangChainTools();

    // Simple keyword matching for demonstration
    const recommendations = [];

    for (const tool of allTools) {
      const toolDescription = tool.description.toLowerCase();
      const contextLower = context.toLowerCase();

      // Score based on keyword matches
      let score = 0;

      // Common keywords that might indicate tool relevance
      if (contextLower.includes('code') || contextLower.includes('generate')) {
        if (toolDescription.includes('code') || toolDescription.includes('generate')) score += 3;
      }

      if (contextLower.includes('search') || contextLower.includes('find')) {
        if (toolDescription.includes('search') || toolDescription.includes('find')) score += 3;
      }

      if (contextLower.includes('deploy') || contextLower.includes('publish')) {
        if (toolDescription.includes('deploy') || toolDescription.includes('publish')) score += 3;
      }

      if (contextLower.includes('test') || contextLower.includes('verify')) {
        if (toolDescription.includes('test') || toolDescription.includes('verify')) score += 3;
      }

      if (score > 0) {
        recommendations.push({ tool: tool, score });
      }
    }

    // Sort by score and return top recommendations
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, options.limit || 5).map(r => r.tool);
  }
}

// Global instance
const langchainAdapter = new LangChainAdapterManager();

/**
 * Utility function to convert Ultra-Dex tool to LangChain tool
 */
export function ultraDexToolToLangChain(ultraDexTool) {
  return new LangChainToolAdapter(ultraDexTool);
}

/**
 * Utility function to convert multiple Ultra-Dex tools to LangChain tools
 */
export function ultraDexToolsToLangChain(ultraDexTools) {
  return ultraDexTools.map(tool => ultraDexToolToLangChain(tool));
}

/**
 * Register a tool directly from definition
 */
export function registerToolFromDefinition(definition) {
  const ultraDexTool = new UltraDexTool(definition);
  langchainAdapter.registerUltraDexTool(ultraDexTool);

  // Automatically create adapter
  const adapter = langchainAdapter.createLangChainAdapter(ultraDexTool.name);

  return adapter;
}

/**
 * Get the global adapter instance
 */
export function getLangChainAdapter() {
  return langchainAdapter;
}

/**
 * Create a tool registry with common tools
 */
export function createCommonToolRegistry() {
  // Common tools that might be useful
  const commonTools = [
    {
      name: 'web-search',
      description: 'Search the web for current information',
      schema: z.object({
        query: z.string().describe('Search query'),
        max_results: z.number().optional().default(5).describe('Maximum number of results')
      }),
      execute: async ({ query, max_results }) => {
        // In a real implementation, this would call a search API
        return { results: [], query, max_results };
      },
      category: 'search'
    },
    {
      name: 'file-reader',
      description: 'Read content from a file',
      schema: z.object({
        path: z.string().describe('File path to read')
      }),
      execute: async ({ path }) => {
        // In a real implementation, this would read the file
        return { content: '', path };
      },
      category: 'file'
    },
    {
      name: 'code-executor',
      description: 'Execute code in a sandboxed environment',
      schema: z.object({
        language: z.string().describe('Programming language'),
        code: z.string().describe('Code to execute')
      }),
      execute: async ({ language, code }) => {
        // In a real implementation, this would execute code safely
        return { result: '', language, code };
      },
      category: 'execution'
    }
  ];

  // Register all common tools
  for (const toolDef of commonTools) {
    registerToolFromDefinition(toolDef);
  }

  printSuccess(chalk.green(`✅ Registered ${commonTools.length} common tools`));
}

/**
 * Initialize the LangChain adapter with common tools
 */
export async function initializeLangChainAdapter() {
  printInfo(chalk.cyan('🔌 Initializing LangChain Adapter...\n'));

  // Create common tool registry
  createCommonToolRegistry();

  // Show adapter stats
  const stats = langchainAdapter.getStats();
  printSuccess(chalk.green(`✅ LangChain Adapter initialized with ${stats.ultraDexTools} tools`));
  printInfo(chalk.gray(`Categories: ${stats.categories.join(', ')}\n`));

  return langchainAdapter;
}

export default {
  UltraDexTool,
  LangChainToolAdapter,
  LangChainAdapterManager,
  langchainAdapter,
  ultraDexToolToLangChain,
  ultraDexToolsToLangChain,
  registerToolFromDefinition,
  getLangChainAdapter,
  initializeLangChainAdapter,
  createCommonToolRegistry
};