// Copyright (c) 2026 Ultra-Dex

/**
 * LangChain Tool Adapter for Ultra-Dex
 * Maps Ultra-Dex Tool definitions to LangChain Tools
 */

import { DynamicTool } from 'langchain/tools';

/**
 * Converts an Ultra-Dex tool definition to a LangChain tool
 * @param {Object} ultraDexTool - Ultra-Dex tool definition
 * @returns {DynamicTool} - LangChain compatible tool
 */
export function ultraDexToolToLangChain(ultraDexTool) {
  // Create a LangChain DynamicTool from Ultra-Dex tool definition
  return new DynamicTool({
    name: ultraDexTool.name || ultraDexTool.id,
    description: ultraDexTool.description || ultraDexTool.desc || '',
    func: async (input) => {
      try {
        // Execute the Ultra-Dex tool function with the provided input
        return await ultraDexTool.func(input);
      } catch (error) {
        // Return error message in a format LangChain expects
        return `Error executing tool: ${error.message}`;
      }
    },
  });
}

/**
 * Converts multiple Ultra-Dex tools to LangChain tools
 * @param {Array<Object>} ultraDexTools - Array of Ultra-Dex tool definitions
 * @returns {Array<DynamicTool>} - Array of LangChain compatible tools
 */
export function ultraDexToolsToLangChain(ultraDexTools) {
  return ultraDexTools.map((tool) => ultraDexToolToLangChain(tool));
}

/**
 * Creates a LangChain tool from a function with schema
 * @param {string} name - Tool name
 * @param {string} description - Tool description
 * @param {Function} func - Function to execute
 * @param {Object} schema - JSON schema for parameters (optional)
 * @returns {DynamicTool} - LangChain compatible tool
 */
export function createLangChainTool(name, description, func, schema = null) {
  return new DynamicTool({
    name,
    description,
    func: async (input) => {
      try {
        // If schema is provided, validate input
        if (schema) {
          const parsedInput = typeof input === 'string' ? JSON.parse(input) : input;
          validateInput(parsedInput, schema);
        }

        // Execute the function with the input
        const result = await func(input);
        return typeof result === 'object' ? JSON.stringify(result) : result;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    },
  });
}

/**
 * Validates input against a JSON schema
 * @param {any} input - Input to validate
 * @param {Object} schema - JSON schema to validate against
 */
function validateInput(input, schema) {
  // Basic validation based on schema properties
  if (
    schema.type &&
    typeof input !== schema.type &&
    !(schema.type === 'array' && Array.isArray(input))
  ) {
    throw new Error(`Expected input of type ${schema.type}, got ${typeof input}`);
  }

  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (propSchema.required && input[propName] === undefined) {
        throw new Error(`Required property '${propName}' is missing`);
      }

      if (input[propName] !== undefined && propSchema.type) {
        const value = input[propName];
        if (
          typeof value !== propSchema.type &&
          !(
            (propSchema.type === 'array' && Array.isArray(value)) ||
            (propSchema.type === 'object' && typeof value === 'object')
          )
        ) {
          throw new Error(
            `Property '${propName}' expected type ${propSchema.type}, got ${typeof value}`
          );
        }
      }
    }
  }
}

/**
 * Adapter class to bridge Ultra-Dex and LangChain ecosystems
 */
export class LangChainAdapter {
  constructor() {
    this.tools = new Map();
  }

  /**
   * Register an Ultra-Dex tool with the adapter
   * @param {string} id - Tool identifier
   * @param {Object} toolDef - Ultra-Dex tool definition
   */
  registerTool(id, toolDef) {
    const langChainTool = ultraDexToolToLangChain({
      id,
      ...toolDef,
    });

    this.tools.set(id, langChainTool);
    return langChainTool;
  }

  /**
   * Get a registered LangChain tool by ID
   * @param {string} id - Tool identifier
   * @returns {DynamicTool} - LangChain tool
   */
  getTool(id) {
    return this.tools.get(id);
  }

  /**
   * Get all registered tools as LangChain tools
   * @returns {Array<DynamicTool>} - Array of LangChain tools
   */
  getAllTools() {
    return Array.from(this.tools.values());
  }

  /**
   * Register multiple tools at once
   * @param {Array<{id: string, definition: Object}>} toolDefs - Array of tool definitions
   */
  registerTools(toolDefs) {
    return toolDefs.map(({ id, definition }) => this.registerTool(id, definition));
  }

  /**
   * Execute a tool by ID with given arguments
   * @param {string} id - Tool identifier
   * @param {any} args - Arguments to pass to the tool
   * @returns {Promise<any>} - Tool execution result
   */
  async executeTool(id, args) {
    const tool = this.tools.get(id);
    if (!tool) {
      throw new Error(`Tool with ID '${id}' not found`);
    }

    return await tool.call(args);
  }
}

// Export default adapter instance
export const langchainAdapter = new LangChainAdapter();

export default {
  ultraDexToolToLangChain,
  ultraDexToolsToLangChain,
  createLangChainTool,
  LangChainAdapter,
  langchainAdapter,
};
