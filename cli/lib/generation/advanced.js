// Copyright (c) 2026 Ultra-Dex

/**
 * Advanced Code Generation AI v6.0
 * Context-aware, multi-pass code generation with optimization
 */

import EventEmitter from 'events';

/**
 * Code Generation Context
 */
export class CodeContext {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.language = options.language || 'typescript';
    this.framework = options.framework || 'nextjs';
    this.style = options.style || 'modern';
    this.patterns = new Map();
    this.dependencies = new Set();
    this.types = new Map();
    this.history = [];
  }

  addPattern(name, template) {
    this.patterns.set(name, template);
  }

  addDependency(name, version = 'latest') {
    this.dependencies.add({ name, version });
  }

  addType(name, definition) {
    this.types.set(name, definition);
  }

  recordGeneration(prompt, code, metadata = {}) {
    this.history.push({
      timestamp: Date.now(),
      prompt,
      code: code.substring(0, 200), // Truncate for storage
      ...metadata,
    });

    if (this.history.length > 1000) {
      this.history.shift();
    }
  }

  getSimilarPatterns(code) {
    // Find similar patterns from history
    return this.history.filter((h) => this.similarity(h.code, code) > 0.7).slice(0, 5);
  }

  similarity(a, b) {
    // Simple string similarity
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}

/**
 * Multi-Pass Code Generator
 */
export class MultiPassGenerator extends EventEmitter {
  constructor(context) {
    super();
    this.context = context;
    this.passes = [
      { name: 'structure', weight: 0.3 },
      { name: 'implementation', weight: 0.4 },
      { name: 'optimization', weight: 0.2 },
      { name: 'polish', weight: 0.1 },
    ];
  }

  async generate(prompt, options = {}) {
    const startTime = Date.now();
    let result = {
      code: '',
      passes: [],
      metrics: {},
    };

    this.emit('generation:start', { prompt, passes: this.passes.length });

    // Pass 1: Structure
    const structure = await this.generateStructure(prompt);
    result.passes.push({ name: 'structure', code: structure });
    this.emit('pass:complete', { name: 'structure' });

    // Pass 2: Implementation
    const implementation = await this.generateImplementation(structure, prompt);
    result.passes.push({ name: 'implementation', code: implementation });
    this.emit('pass:complete', { name: 'implementation' });

    // Pass 3: Optimization
    const optimized = await this.optimizeCode(implementation);
    result.passes.push({ name: 'optimization', code: optimized });
    this.emit('pass:complete', { name: 'optimization' });

    // Pass 4: Polish
    const polished = await this.polishCode(optimized);
    result.passes.push({ name: 'polish', code: polished });
    this.emit('pass:complete', { name: 'polish' });

    result.code = polished;
    result.metrics = {
      duration: Date.now() - startTime,
      lines: polished.split('\n').length,
      characters: polished.length,
      passes: result.passes.length,
    };

    this.context.recordGeneration(prompt, result.code, result.metrics);
    this.emit('generation:complete', result);

    return result;
  }

  async generateStructure(prompt) {
    // Analyze prompt and generate basic structure
    const patterns = this.context.getSimilarPatterns(prompt);

    let structure = '';

    // Extract components from prompt
    const components = this.extractComponents(prompt);

    // Generate imports
    structure += this.generateImports(components);

    // Generate types/interfaces
    structure += this.generateTypes(components);

    // Generate function/component signature
    structure += this.generateSignature(components);

    return structure;
  }

  extractComponents(prompt) {
    const components = {
      functions: [],
      classes: [],
      imports: [],
      types: [],
    };

    // Extract function names
    const functionMatches = prompt.match(
      /(?:create|implement|write|generate)\s+(?:a\s+)?(?:function|component|hook|class)\s+(?:called\s+)?['"`]?(\w+)['"`]?/gi
    );
    if (functionMatches) {
      components.functions = functionMatches
        .map((m) => m.match(/(\w+)$/)?.[1] || m.match(/(\w+)['"`]?$/)?.[1])
        .filter(Boolean);
    }

    // Detect required imports from keywords
    const importKeywords = {
      react: 'React',
      next: 'Next.js',
      express: 'Express',
      prisma: 'Prisma',
      stripe: 'Stripe',
      auth: 'NextAuth',
      api: 'API route',
    };

    for (const [keyword, module] of Object.entries(importKeywords)) {
      if (prompt.toLowerCase().includes(keyword)) {
        components.imports.push(module);
      }
    }

    return components;
  }

  generateImports(components) {
    const imports = [];

    if (components.imports.includes('React')) {
      imports.push("import React from 'react';");
    }
    if (components.imports.includes('Next.js')) {
      imports.push("import { NextPage } from 'next';");
    }

    return imports.join('\n') + '\n\n';
  }

  generateTypes(components) {
    if (components.types.length === 0 && components.functions.length === 0) {
      return '';
    }

    let types = '';

    for (const func of components.functions) {
      types += `interface ${func}Props {\n  // TODO: Add props\n}\n\n`;
    }

    return types;
  }

  generateSignature(components) {
    if (components.functions.length > 0) {
      const func = components.functions[0];
      return `export function ${func}(props: ${func}Props) {\n  // Implementation\n}`;
    }
    return '';
  }

  async generateImplementation(structure, prompt) {
    // Add actual implementation based on structure
    let implementation = structure;

    // Add state if needed
    if (prompt.includes('state') || prompt.includes('useState')) {
      implementation = implementation.replace(
        '// Implementation',
        'const [data, setData] = useState(null);\n  \n  // Implementation'
      );
    }

    // Add effect if needed
    if (prompt.includes('fetch') || prompt.includes('load') || prompt.includes('api')) {
      implementation = implementation.replace(
        '// Implementation',
        `useEffect(() => {\n    // Fetch data\n  }, []);\n  \n  // Implementation`
      );
    }

    // Add error handling
    if (!implementation.includes('try') && prompt.includes('api')) {
      implementation = implementation.replace(
        '// Implementation',
        `try {\n    // Implementation\n  } catch (error) {\n    console.error('Error:', error);\n  }`
      );
    }

    return implementation;
  }

  async optimizeCode(code) {
    // Apply optimizations
    let optimized = code;

    // Remove unused imports
    optimized = this.removeUnusedImports(optimized);

    // Add memoization for expensive computations
    if (optimized.includes('useState') && !optimized.includes('useMemo')) {
      optimized = optimized.replace(
        'const [data, setData]',
        'const memoizedData = useMemo(() => {\n    return data;\n  }, [data]);\n  \n  const [data, setData]'
      );
    }

    // Optimize re-renders with useCallback
    if (optimized.includes('function') && !optimized.includes('useCallback')) {
      optimized = optimized.replace(
        /const (\w+) = \([^)]*\) => \{/,
        'const $1 = useCallback(($2) => {'
      );
    }

    return optimized;
  }

  removeUnusedImports(code) {
    // Simple unused import removal
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"];/g;
    return code.replace(importRegex, (match, imports, source) => {
      const usedImports = imports.split(',').filter((imp) => {
        const name = imp.trim().split(' as ')[0];
        return code.includes(name) && !match.includes(name);
      });

      if (usedImports.length === 0) {
        return '';
      }

      return `import { ${usedImports.join(', ')} } from '${source}';`;
    });
  }

  async polishCode(code) {
    // Add documentation
    let polished = code;

    if (!polished.includes('/**') && polished.includes('export function')) {
      polished = polished.replace(
        /export function (\w+)/,
        `/**\n * $1 - Generated by Ultra-Dex\n * @param props - Component props\n * @returns JSX Element\n */\nexport function $1`
      );
    }

    // Add return type
    if (polished.includes('export function') && !polished.includes(': JSX.Element')) {
      polished = polished.replace(
        /export function (\w+)\(([^)]*)\)\s*\{/,
        'export function $1($2): JSX.Element {'
      );
    }

    // Format code
    polished = this.formatCode(polished);

    return polished;
  }

  formatCode(code) {
    // Simple formatting
    return code
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
  }
}

/**
 * Template Engine
 */
export class TemplateEngine {
  constructor() {
    this.templates = new Map();
    this.registerDefaultTemplates();
  }

  registerDefaultTemplates() {
    // React Component Template
    this.templates.set('react-component', {
      name: 'React Component',
      template: `import React, { useState, useEffect } from 'react';

interface {{name}}Props {
  {{#each props}}
  {{name}}: {{type}};
  {{/each}}
}

export function {{name}}(props: {{name}}Props) {
  const [state, setState] = useState({});

  useEffect(() => {
    // Initialize
  }, []);

  return (
    <div className="{{kebabCase name}}">
      {/* Component content */}
    </div>
  );
}`,
    });

    // API Route Template
    this.templates.set('api-route', {
      name: 'API Route',
      template: `import { NextRequest, NextResponse } from 'next/server';

export async function {{method}}(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Process request
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}`,
    });

    // Hook Template
    this.templates.set('hook', {
      name: 'Custom Hook',
      template: `import { useState, useEffect, useCallback } from 'react';

export function use{{pascalCase name}}() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    try {
      // Implementation
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, execute };
}`,
    });
  }

  register(name, template) {
    this.templates.set(name, template);
  }

  render(templateName, data) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    let result = template.template;

    // Simple template replacement
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }

    // Handle helpers
    result = result.replace(/{{kebabCase (\w+)}}/g, (match, name) => {
      return data[name]?.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() || '';
    });

    result = result.replace(/{{pascalCase (\w+)}}/g, (match, name) => {
      const val = data[name] || '';
      return val.charAt(0).toUpperCase() + val.slice(1);
    });

    return result;
  }

  list() {
    return Array.from(this.templates.entries()).map(([key, value]) => ({
      key,
      name: value.name,
    }));
  }
}

/**
 * Smart Code Suggester
 */
export class SmartSuggester extends EventEmitter {
  constructor(context) {
    super();
    this.context = context;
    this.patterns = new Map();
    this.learned = [];
  }

  learn(code, description) {
    this.learned.push({ code, description, timestamp: Date.now() });
  }

  suggest(code, cursor) {
    const suggestions = [];

    // Context-aware suggestions
    const beforeCursor = code.substring(0, cursor);
    const afterCursor = code.substring(cursor);

    // Suggest imports
    if (beforeCursor.includes('import') && !beforeCursor.includes('from')) {
      suggestions.push({
        type: 'import',
        text: "from 'react';",
        reason: 'Complete import statement',
      });
    }

    // Suggest useState
    if (beforeCursor.includes('const [') && !beforeCursor.includes('useState')) {
      suggestions.push({
        type: 'hook',
        text: 'useState',
        reason: 'Add state management',
      });
    }

    // Suggest error handling
    if (beforeCursor.includes('await') && !beforeCursor.includes('try')) {
      suggestions.push({
        type: 'error-handling',
        text: 'try {\n  \n} catch (error) {\n  \n}',
        reason: 'Add error handling for async code',
      });
    }

    // Learn from patterns
    for (const learned of this.learned) {
      if (this.similarity(code, learned.code) > 0.6) {
        suggestions.push({
          type: 'learned',
          text: learned.code.substring(cursor, cursor + 100),
          reason: `Similar to: ${learned.description}`,
        });
      }
    }

    return suggestions.slice(0, 5);
  }

  similarity(a, b) {
    // Simple similarity check
    const common = [...a].filter((c) => b.includes(c)).length;
    return common / Math.max(a.length, b.length);
  }
}

export default {
  MultiPassGenerator,
  CodeContext,
  TemplateEngine,
  SmartSuggester,
};
