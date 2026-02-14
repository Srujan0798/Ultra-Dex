#!/usr/bin/env node

/**
 * Ultra-Dex Documentation Generator
 * 
 * This example demonstrates how to create an AI-powered documentation generation system using Ultra-Dex.
 * The system can automatically generate documentation from code, comments, and specifications.
 * 
 * Features:
 * - Code analysis and documentation extraction
 * - Multi-format documentation generation
 * - API documentation generation
 * - Architecture documentation
 * - Tutorials and guides
 */

import { UltraDex } from '../src/ultradex.js';
import fs from 'fs/promises';
import path from 'path';

class DocumentationGenerator {
  constructor(config) {
    this.ultraDex = new UltraDex(config.ultraDex);
    
    // Initialize specialized agents
    this.agents = {
      codeAnalyzer: this.ultraDex.createAgent({
        name: 'code-analyzer',
        role: 'Analyzes code to extract functionality, parameters, and usage patterns',
        tools: ['ast-parser', 'symbol-extractor', 'dependency-analyzer', 'pattern-recognition']
      }),
      
      docGenerator: this.ultraDex.createAgent({
        name: 'doc-generator',
        role: 'Generates clear, comprehensive documentation based on code analysis',
        tools: ['formatting-engine', 'example-generator', 'cross-reference-builder', 'language-model']
      }),
      
      apiDocGenerator: this.ultraDex.createAgent({
        name: 'api-doc-generator',
        role: 'Generates API documentation with endpoints, parameters, and examples',
        tools: ['endpoint-extractor', 'parameter-analyzer', 'request-response-builder', 'swagger-generator']
      }),
      
      tutorialCreator: this.ultraDex.createAgent({
        name: 'tutorial-creator',
        role: 'Creates step-by-step tutorials based on code functionality',
        tools: ['workflow-analyzer', 'step-generator', 'example-builder', 'difficulty-assessor']
      }),
      
      qualityAssessor: this.ultraDex.createAgent({
        name: 'quality-assessor',
        role: 'Assesses documentation quality and suggests improvements',
        tools: ['completeness-checker', 'clarity-analyzer', 'accuracy-verifier', 'style-checker']
      })
    };
    
    this.sourceCode = config.sourceCode || '';
    this.documentation = [];
  }

  /**
   * Generate documentation from source code
   */
  async generateFromCode(sourcePath, options = {}) {
    try {
      // Read source code
      const code = await fs.readFile(sourcePath, 'utf8');
      
      // Analyze the code
      const analysis = await this.agents.codeAnalyzer.execute({
        code,
        language: this.detectLanguage(sourcePath),
        filePath: sourcePath
      });
      
      // Generate documentation
      const documentation = await this.agents.docGenerator.execute({
        codeAnalysis: analysis,
        format: options.format || 'markdown',
        includeExamples: options.includeExamples !== false,
        includeDiagrams: options.includeDiagrams || false,
        targetAudience: options.audience || 'developers'
      });
      
      // Create documentation object
      const docItem = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourcePath,
        content: documentation.content,
        format: options.format || 'markdown',
        analysis,
        createdAt: new Date().toISOString(),
        metadata: {
          language: this.detectLanguage(sourcePath),
          linesOfCode: code.split('\n').length,
          functions: analysis.functions?.length || 0,
          classes: analysis.classes?.length || 0,
          complexity: analysis.complexity || 'unknown'
        }
      };
      
      this.documentation.push(docItem);
      return docItem;
      
    } catch (error) {
      console.error('Error generating documentation from code:', error);
      throw error;
    }
  }

  /**
   * Generate API documentation
   */
  async generateApiDocs(apiSpecPath, options = {}) {
    try {
      // Read API specification
      const apiSpec = await fs.readFile(apiSpecPath, 'utf8');
      const specObj = JSON.parse(apiSpec);
      
      // Generate API documentation
      const apiDocs = await this.agents.apiDocGenerator.execute({
        apiSpecification: specObj,
        format: options.format || 'openapi',
        includeExamples: options.includeExamples !== false,
        includeAuthentication: options.includeAuthentication !== false,
        version: options.version || '1.0.0'
      });
      
      // Create API documentation object
      const docItem = {
        id: `api-doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourcePath: apiSpecPath,
        content: apiDocs.documentation,
        format: 'openapi',
        type: 'api',
        createdAt: new Date().toISOString(),
        metadata: {
          endpoints: apiDocs.endpoints?.length || 0,
          methods: apiDocs.methods || [],
          authentication: apiDocs.authentication || 'none'
        }
      };
      
      this.documentation.push(docItem);
      return docItem;
      
    } catch (error) {
      console.error('Error generating API documentation:', error);
      throw error;
    }
  }

  /**
   * Generate tutorial from code
   */
  async generateTutorial(codePath, topic, options = {}) {
    try {
      // Read code
      const code = await fs.readFile(codePath, 'utf8');
      
      // Analyze code for tutorial creation
      const analysis = await this.agents.codeAnalyzer.execute({
        code,
        language: this.detectLanguage(codePath),
        filePath: codePath
      });
      
      // Create tutorial
      const tutorial = await this.agents.tutorialCreator.execute({
        codeAnalysis: analysis,
        topic,
        difficulty: options.difficulty || 'beginner',
        targetAudience: options.audience || 'developers',
        includeCodeExamples: options.includeCodeExamples !== false,
        stepsCount: options.stepsCount || 5
      });
      
      // Create tutorial object
      const docItem = {
        id: `tutorial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourcePath: codePath,
        content: tutorial.content,
        format: 'markdown',
        type: 'tutorial',
        topic,
        createdAt: new Date().toISOString(),
        metadata: {
          difficulty: options.difficulty || 'beginner',
          estimatedTime: tutorial.estimatedCompletionTime,
          steps: tutorial.steps?.length || 0,
          language: this.detectLanguage(codePath)
        }
      };
      
      this.documentation.push(docItem);
      return docItem;
      
    } catch (error) {
      console.error('Error generating tutorial:', error);
      throw error;
    }
  }

  /**
   * Generate architecture documentation
   */
  async generateArchitectureDocs(projectRoot, options = {}) {
    try {
      // Analyze project structure
      const projectStructure = await this.analyzeProjectStructure(projectRoot);
      
      // Generate architecture documentation
      const archDocs = await this.agents.docGenerator.execute({
        projectStructure,
        type: 'architecture',
        format: options.format || 'markdown',
        includeDiagrams: options.includeDiagrams !== false,
        includeDecisions: options.includeDecisions !== false,
        targetAudience: options.audience || 'architects'
      });
      
      // Create architecture documentation object
      const docItem = {
        id: `arch-doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourcePath: projectRoot,
        content: archDocs.documentation,
        format: 'markdown',
        type: 'architecture',
        createdAt: new Date().toISOString(),
        metadata: {
          components: archDocs.components?.length || 0,
          patterns: archDocs.patterns || [],
          technologies: archDocs.technologies || []
        }
      };
      
      this.documentation.push(docItem);
      return docItem;
      
    } catch (error) {
      console.error('Error generating architecture documentation:', error);
      throw error;
    }
  }

  /**
   * Assess documentation quality
   */
  async assessQuality(docId, referenceStandards = {}) {
    const doc = this.documentation.find(d => d.id === docId);
    if (!doc) {
      throw new Error('Documentation not found');
    }
    
    const assessment = await this.agents.qualityAssessor.execute({
      documentation: doc.content,
      format: doc.format,
      referenceStandards,
      targetAudience: doc.metadata.audience || 'developers'
    });
    
    // Update documentation with assessment
    doc.qualityAssessment = assessment;
    doc.lastAssessedAt = new Date().toISOString();
    
    return assessment;
  }

  /**
   * Detect programming language from file extension
   */
  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'c++',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.html': 'html',
      '.css': 'css',
      '.sql': 'sql'
    };
    
    return languageMap[ext] || 'unknown';
  }

  /**
   * Analyze project structure recursively
   */
  async analyzeProjectStructure(dirPath, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return { path: dirPath, type: 'directory', children: [] };
    
    try {
      const items = await fs.readdir(dirPath);
      const structure = {
        path: dirPath,
        type: 'directory',
        children: []
      };
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          structure.children.push(await this.analyzeProjectStructure(fullPath, depth + 1, maxDepth));
        } else {
          structure.children.push({
            path: fullPath,
            type: 'file',
            extension: path.extname(item),
            language: this.detectLanguage(item)
          });
        }
      }
      
      return structure;
    } catch (error) {
      console.error(`Error analyzing directory ${dirPath}:`, error);
      return { path: dirPath, type: 'directory', children: [], error: error.message };
    }
  }

  /**
   * Export documentation to file
   */
  async exportDocumentation(docId, outputPath, format = 'markdown') {
    const doc = this.documentation.find(d => d.id === docId);
    if (!doc) {
      throw new Error('Documentation not found');
    }
    
    // Convert format if necessary
    let content = doc.content;
    if (format !== doc.format) {
      // In a real implementation, this would convert between formats
      content = this.convertFormat(doc.content, doc.format, format);
    }
    
    await fs.writeFile(outputPath, content);
    return { success: true, outputPath, format };
  }

  /**
   * Convert documentation format (simplified)
   */
  convertFormat(content, fromFormat, toFormat) {
    // Simplified format conversion
    // In a real implementation, this would use proper converters
    return content;
  }

  /**
   * Get documentation statistics
   */
  getStats() {
    const totalDocs = this.documentation.length;
    const byType = this.documentation.reduce((acc, doc) => {
      const type = doc.type || 'general';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const byLanguage = this.documentation.reduce((acc, doc) => {
      const lang = doc.metadata.language || 'unknown';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});
    
    const totalLOC = this.documentation.reduce((sum, doc) => 
      sum + (doc.metadata.linesOfCode || 0), 0);
    
    return {
      totalDocuments: totalDocs,
      byType,
      byLanguage,
      totalLinesOfCode: totalLOC,
      generatedSince: this.documentation.length > 0 
        ? this.documentation[0].createdAt 
        : new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Bulk generate documentation for a project
   */
  async bulkGenerate(projectPath, options = {}) {
    const results = {
      processed: [],
      errors: [],
      summary: {}
    };
    
    try {
      const structure = await this.analyzeProjectStructure(projectPath);
      const files = this.extractFiles(structure);
      
      for (const file of files) {
        try {
          if (this.isCodeFile(file.path)) {
            const doc = await this.generateFromCode(file.path, options);
            results.processed.push({ file: file.path, docId: doc.id });
          }
        } catch (error) {
          results.errors.push({ file: file.path, error: error.message });
        }
      }
      
      // Generate architecture docs
      try {
        const archDoc = await this.generateArchitectureDocs(projectPath, options);
        results.processed.push({ file: projectPath, docId: archDoc.id, type: 'architecture' });
      } catch (error) {
        results.errors.push({ file: projectPath, error: `Architecture doc: ${error.message}` });
      }
      
      results.summary = this.getStats();
      return results;
      
    } catch (error) {
      console.error('Error in bulk generation:', error);
      throw error;
    }
  }

  /**
   * Extract files from project structure
   */
  extractFiles(structure) {
    const files = [];
    
    function traverse(node) {
      if (node.type === 'file') {
        files.push(node);
      } else if (node.type === 'directory' && node.children) {
        node.children.forEach(traverse);
      }
    }
    
    traverse(structure);
    return files;
  }

  /**
   * Check if a file is a code file
   */
  isCodeFile(filePath) {
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.cs', '.php', '.rb', '.swift', '.kt', '.scala'];
    return codeExtensions.includes(path.extname(filePath).toLowerCase());
  }
}

// Example usage
async function main() {
  const docGenerator = new DocumentationGenerator({
    ultraDex: {
      apiKey: process.env.ULTRA_DEX_API_KEY,
      endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai'
    }
  });
  
  // Generate documentation for a sample file
  try {
    // This would normally point to an actual code file
    // For this example, we'll simulate with a dummy path
    console.log('Documentation generator initialized. Use generateFromCode() to generate docs from actual files.');
    
    // Example of how to use:
    /*
    const doc = await docGenerator.generateFromCode('./path/to/your/code.js', {
      format: 'markdown',
      includeExamples: true,
      audience: 'beginner-developers'
    });
    
    console.log(`Generated documentation for: ${doc.sourcePath}`);
    console.log(`Functions documented: ${doc.metadata.functions}`);
    */
    
    // Print documentation statistics
    console.log('Documentation Stats:', docGenerator.getStats());
  } catch (error) {
    console.error('Error in main:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default DocumentationGenerator;