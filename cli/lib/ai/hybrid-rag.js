/**
 * Ultra-Dex Hybrid RAG System
 * Combines vector search, graph analysis, and keyword search for comprehensive codebase understanding
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { projectGraph } from '../mcp/graph.js';
import { monitoring } from '../utils/monitoring.js';

class VectorSearch {
  constructor(options = {}) {
    this.dimension = options.dimension || 1536; // Default embedding dimension
    this.vectorStore = new Map(); // In-memory vector store for simplicity
    this.documents = new Map(); // Store original documents
  }

  // Simple embedding using TF-IDF approach (without external dependencies)
  async createEmbedding(text) {
    // Create a simple numerical representation of text
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Normalize frequencies
    const totalWords = words.length;
    const normalized = {};
    for (const [word, freq] of Object.entries(wordFreq)) {
      normalized[word] = freq / totalWords;
    }

    return normalized;
  }

  async indexDocument(id, content, metadata = {}) {
    const embedding = await this.createEmbedding(content);
    this.vectorStore.set(id, embedding);
    this.documents.set(id, { content, metadata, id });
  }

  async search(query, topK = 5) {
    const queryEmbedding = await this.createEmbedding(query);
    const similarities = [];

    for (const [id, docEmbedding] of this.vectorStore) {
      const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
      similarities.push({
        id,
        similarity,
        content: this.documents.get(id)?.content,
        metadata: this.documents.get(id)?.metadata
      });
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  cosineSimilarity(vecA, vecB) {
    const words = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const word of words) {
      const aVal = vecA[word] || 0;
      const bVal = vecB[word] || 0;
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

class GraphSearch {
  constructor() {
    this.graph = projectGraph;
  }

  async search(query) {
    // Search in the code property graph
    await this.graph.scan(); // Ensure graph is up to date
    
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    // Search in nodes (files)
    for (const [filePath, node] of this.graph.nodes) {
      if (filePath.toLowerCase().includes(lowerQuery) || 
          node.content?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'file',
          path: filePath,
          content: node.content?.substring(0, 200) + '...',
          score: 1.0
        });
      }
    }

    // Search in edges (dependencies)
    for (const edge of this.graph.edges) {
      if (edge.from.toLowerCase().includes(lowerQuery) || 
          edge.to.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'dependency',
          from: edge.from,
          to: edge.to,
          relationship: edge.type,
          score: 0.9
        });
      }
    }

    return results;
  }

  async findRelatedFiles(filePath) {
    // Find files that depend on or are depended by the given file
    await this.graph.scan();
    
    const related = {
      dependencies: [], // Files this file depends on
      dependents: [],   // Files that depend on this file
      siblings: []      // Files in the same directory
    };

    // Find dependencies
    for (const edge of this.graph.edges) {
      if (edge.from === filePath) {
        related.dependencies.push(edge.to);
      }
      if (edge.to === filePath) {
        related.dependents.push(edge.from);
      }
    }

    // Find siblings
    const dir = path.dirname(filePath);
    for (const [nodePath] of this.graph.nodes) {
      if (path.dirname(nodePath) === dir && nodePath !== filePath) {
        related.siblings.push(nodePath);
      }
    }

    return related;
  }
}

class KeywordSearch {
  constructor() {
    this.index = new Map();
  }

  async indexFile(filePath, content) {
    // Create keyword index for the file
    const keywords = this.extractKeywords(content);
    this.index.set(filePath, {
      keywords,
      content,
      path: filePath,
      size: content.length
    });
  }

  extractKeywords(text) {
    // Extract meaningful keywords from text
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word));
    
    // Count word frequencies
    const freq = {};
    words.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });
    
    return freq;
  }

  isStopWord(word) {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'this', 'that', 'these', 'those', 'i', 'you', 'we', 'they', 'he', 'she', 'it',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
    ]);
    return stopWords.has(word);
  }

  async search(query, topK = 5) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const [filePath, fileData] of this.index) {
      let score = 0;
      
      // Exact match in path
      if (filePath.toLowerCase().includes(lowerQuery)) {
        score += 2;
      }
      
      // Matches in content
      const contentMatches = (fileData.content.toLowerCase().match(new RegExp(lowerQuery, 'g')) || []).length;
      score += contentMatches * 0.5;
      
      // Matches in keywords
      for (const [keyword, freq] of Object.entries(fileData.keywords)) {
        if (keyword.includes(lowerQuery)) {
          score += freq * 0.3;
        }
      }

      if (score > 0) {
        results.push({
          path: filePath,
          score,
          preview: fileData.content.substring(0, 200) + '...',
          size: fileData.size
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

class HybridRAG {
  constructor() {
    this.vectorSearch = new VectorSearch();
    this.graphSearch = new GraphSearch();
    this.keywordSearch = new KeywordSearch();
    this.projectRoot = process.cwd();
    this.indexed = false;
  }

  async initialize() {
    if (this.indexed) return;

    // Silent initialization (use monitoring.info for debugging)

    // Index all project files
    await this.indexProject();
    
    this.indexed = true;
    monitoring.info('Hybrid RAG system initialized', {
      filesIndexed: this.vectorSearch.documents.size,
      projectRoot: this.projectRoot
    });
  }

  async indexProject() {
    const files = await glob('**/*.{js,ts,jsx,tsx,md,json,html,css}', {
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', '.next/**'],
      cwd: this.projectRoot
    });

    for (const file of files) {
      try {
        const fullPath = path.join(this.projectRoot, file);
        const content = await fs.readFile(fullPath, 'utf8');
        
        // Index in all search systems
        await this.vectorSearch.indexDocument(file, content, { path: file });
        await this.keywordSearch.indexFile(file, content);
      } catch (error) {
        // Skip files that can't be read
        console.warn(`⚠️  Could not index ${file}: ${error.message}`);
      }
    }
  }

  async search(query, options = {}) {
    const { 
      vectorWeight = 0.4, 
      graphWeight = 0.3, 
      keywordWeight = 0.3,
      topK = 10
    } = options;

    await this.initialize();

    // Run all search types
    const vectorResults = await this.vectorSearch.search(query, topK);
    const graphResults = await this.graphSearch.search(query);
    const keywordResults = await this.keywordSearch.search(query, topK);

    // Combine and rank results
    const combinedResults = this.combineSearchResults(
      vectorResults, 
      graphResults, 
      keywordResults,
      vectorWeight,
      graphWeight,
      keywordWeight
    );

    return combinedResults.slice(0, topK);
  }

  combineSearchResults(vectorResults, graphResults, keywordResults, vWeight, gWeight, kWeight) {
    const allResults = new Map();

    // Process vector results
    for (const result of vectorResults) {
      const id = result.id || result.path;
      if (!allResults.has(id)) {
        allResults.set(id, {
          id,
          path: result.path || id,
          content: result.content,
          score: 0,
          sources: []
        });
      }
      allResults.get(id).score += result.similarity * vectorWeight;
      allResults.get(id).sources.push('vector');
    }

    // Process graph results
    for (const result of graphResults) {
      const id = result.path || result.from;
      if (!allResults.has(id)) {
        allResults.set(id, {
          id,
          path: result.path || result.from,
          content: result.content,
          score: 0,
          sources: []
        });
      }
      allResults.get(id).score += result.score * graphWeight;
      allResults.get(id).sources.push('graph');
    }

    // Process keyword results
    for (const result of keywordResults) {
      const id = result.path;
      if (!allResults.has(id)) {
        allResults.set(id, {
          id,
          path: result.path,
          content: result.preview,
          score: 0,
          sources: []
        });
      }
      allResults.get(id).score += result.score * keywordWeight;
      allResults.get(id).sources.push('keyword');
    }

    // Convert to array and sort by score
    return Array.from(allResults.values())
      .sort((a, b) => b.score - a.score);
  }

  async searchCode(query) {
    // Specialized search for code-related queries
    const results = await this.search(query);
    
    // Filter for code files and enrich with graph information
    const codeResults = [];
    
    for (const result of results) {
      if (/\.(js|ts|jsx|tsx|py|java|cpp|go|rs)$/.test(result.path)) {
        // Add graph context
        const related = await this.graphSearch.findRelatedFiles(result.path);
        codeResults.push({
          ...result,
          relatedFiles: related,
          isCode: true
        });
      }
    }
    
    return codeResults;
  }

  async searchArchitecture(query) {
    // Specialized search for architecture-related queries
    const results = await this.search(query);
    
    // Look for architecture-related files
    const archResults = results.filter(result => 
      result.path.includes('config') || 
      result.path.includes('arch') || 
      result.path.includes('structure') ||
      result.path.includes('schema') ||
      result.path.includes('model') ||
      result.path.includes('api')
    );
    
    return archResults;
  }

  async getProjectOverview() {
    await this.initialize();
    
    const stats = {
      totalFiles: this.vectorSearch.documents.size,
      vectorDocuments: this.vectorSearch.documents.size,
      keywordIndexed: this.keywordSearch.index.size,
      graphNodes: projectGraph.nodes.size,
      graphEdges: projectGraph.edges.length
    };
    
    // Get most important files based on various heuristics
    const importantFiles = [];
    
    // Look for key files
    const keyPatterns = [
      'package.json', 'README.md', 'CONTEXT.md', 'IMPLEMENTATION-PLAN.md',
      'api/', 'auth/', 'database/', 'config/', 'lib/', 'src/'
    ];
    
    for (const [path, doc] of this.vectorSearch.documents) {
      if (keyPatterns.some(pattern => path.includes(pattern))) {
        importantFiles.push({
          path,
          size: doc.content.length,
          type: this.getFileType(path)
        });
      }
    }
    
    return {
      stats,
      importantFiles: importantFiles.slice(0, 20),
      projectStructure: this.getProjectStructure()
    };
  }

  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.md') return 'documentation';
    if (ext === '.json') return 'configuration';
    if (ext === '.js' || ext === '.ts') return 'code';
    if (ext === '.css' || ext === '.scss') return 'styling';
    if (ext === '.html') return 'markup';
    return 'other';
  }

  getProjectStructure() {
    const structure = {};
    
    for (const [path] of this.vectorSearch.documents) {
      const parts = path.split('/');
      let current = structure;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = { _files: [], _dirs: {} };
        }
        current = current[part]._dirs;
      }
      
      const fileName = parts[parts.length - 1];
      if (!current[fileName]) {
        current[fileName] = { _files: [path], _dirs: {} };
      } else {
        current[fileName]._files.push(path);
      }
    }
    
    return structure;
  }

  async updateIndex() {
    // Re-index the project when files change
    this.indexed = false;
    await this.indexProject();
    this.indexed = true;
    
    monitoring.info('Project index updated', {
      filesIndexed: this.vectorSearch.documents.size,
      timestamp: new Date().toISOString()
    });
  }
}

// Global instance
export const hybridRAG = new HybridRAG();

// Initialize on import
hybridRAG.initialize().catch(console.error);

export default hybridRAG;