// Copyright (c) 2026 Ultra-Dex

export class VectorStore {
  constructor(config) {
    this.config = config;
    this.provider = config.provider || 'simulated'; // Default to simulated
    this.client = null;
    this.collection = null;
    this.index = null;
    this.storage = new Map(); // In-memory storage for simulation
  }

  async initialize() {
    if (this.provider === 'chroma') {
      try {
        const { ChromaClient } = await import('chromadb');
        this.client = new ChromaClient({
          path: this.config.url || 'http://localhost:8000'
        });
        
        // Create or get collection
        const collections = await this.client.listCollections();
        const collectionExists = collections.some(col => col.name === this.config.collectionName);
        
        if (!collectionExists) {
          this.collection = await this.client.createCollection({
            name: this.config.collectionName,
            metadata: { description: 'Ultra-Dex vector store' }
          });
        } else {
          this.collection = await this.client.getCollection({
            name: this.config.collectionName
          });
        }
      } catch (error) {
        console.warn('ChromaDB not available, falling back to simulated vector store:', error.message);
        this.provider = 'simulated';
      }
    } else if (this.provider === 'pinecone') {
      try {
        if (!this.config.apiKey) {
          throw new Error('Pinecone API key required');
        }
        
        const { Pinecone } = await import('@pinecone-database/pinecone');
        this.client = new Pinecone({
          apiKey: this.config.apiKey,
          environment: this.config.environment
        });
        
        this.index = this.client.Index(this.config.indexName);
      } catch (error) {
        console.warn('Pinecone not available, falling back to simulated vector store:', error.message);
        this.provider = 'simulated';
      }
    }
    
    // If still not initialized properly, use simulated
    if (!this.client && this.provider !== 'simulated') {
      this.provider = 'simulated';
    }
  }

  async embedText(text) {
    // This is a simplified embedding function
    // In a real implementation, this would call an embedding API
    // For now, we'll simulate embeddings with a simple hash-based approach
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(text).digest();
    const hashArray = Array.from(hash);
    
    // Convert to 1536-dimensional vector (same as OpenAI ada-002)
    const embedding = new Array(1536).fill(0).map((_, i) => {
      const byteIndex = i % hashArray.length;
      return (hashArray[byteIndex] - 128) / 128; // Normalize to [-1, 1]
    });
    
    return embedding;
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async upsert(documents) {
    if (!this.client) {
      await this.initialize();
    }

    if (this.provider === 'chroma') {
      const ids = [];
      const embeddings = [];
      const metadatas = [];
      const documentsText = [];

      for (const doc of documents) {
        const id = doc.id || this.generateId();
        const embedding = await this.embedText(doc.content);
        
        ids.push(id);
        embeddings.push(embedding);
        metadatas.push(doc.metadata || {});
        documentsText.push(doc.content);
      }

      await this.collection.add({
        ids,
        embeddings,
        metadatas,
        documents: documentsText
      });
    } else if (this.provider === 'pinecone') {
      const vectors = [];

      for (const doc of documents) {
        const id = doc.id || this.generateId();
        const embedding = await this.embedText(doc.content);

        vectors.push({
          id,
          values: embedding,
          metadata: doc.metadata || {}
        });
      }

      await this.index.upsert({
        vectors,
        namespace: this.config.namespace || 'default'
      });
    } else if (this.provider === 'simulated') {
      // Simulated vector storage
      for (const doc of documents) {
        const id = doc.id || this.generateId();
        const embedding = await this.embedText(doc.content);
        
        this.storage.set(id, {
          id,
          content: doc.content,
          embedding,
          metadata: doc.metadata || {},
          timestamp: Date.now()
        });
      }
    }
  }

  async search(query, k = 5) {
    if (!this.client) {
      await this.initialize();
    }

    const queryEmbedding = await this.embedText(query);

    if (this.provider === 'chroma') {
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: k
      });

      return results.documents[0].map((doc, idx) => ({
        id: results.ids[0][idx],
        content: doc,
        metadata: results.metadatas[0][idx],
        score: results.distances[0][idx]
      }));
    } else if (this.provider === 'pinecone') {
      const results = await this.index.query({
        vector: queryEmbedding,
        topK: k,
        includeMetadata: true,
        namespace: this.config.namespace || 'default'
      });

      return results.matches.map(match => ({
        id: match.id,
        content: match.metadata?.text || '',
        metadata: match.metadata,
        score: match.score
      }));
    } else if (this.provider === 'simulated') {
      // Simulated search using cosine similarity
      const similarities = [];
      
      for (const [id, stored] of this.storage.entries()) {
        const similarity = this.cosineSimilarity(queryEmbedding, stored.embedding);
        similarities.push({
          id: stored.id,
          content: stored.content,
          metadata: stored.metadata,
          score: similarity
        });
      }
      
      // Sort by similarity score (descending)
      similarities.sort((a, b) => b.score - a.score);
      
      return similarities.slice(0, k);
    }
  }

  async delete(ids) {
    if (!this.client) {
      await this.initialize();
    }

    if (this.provider === 'chroma') {
      await this.collection.delete({
        ids: Array.isArray(ids) ? ids : [ids]
      });
    } else if (this.provider === 'pinecone') {
      await this.index.deleteMany({
        ids: Array.isArray(ids) ? ids : [ids],
        namespace: this.config.namespace || 'default'
      });
    } else if (this.provider === 'simulated') {
      const idList = Array.isArray(ids) ? ids : [ids];
      for (const id of idList) {
        this.storage.delete(id);
      }
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
  
  async close() {
    if (this.client && this.provider === 'chroma') {
      // ChromaDB doesn't have a specific close method
      this.client = null;
    } else if (this.client && this.provider === 'pinecone') {
      // Pinecone doesn't have a specific close method
      this.client = null;
    }
    // For simulated provider, nothing to close
  }
  
  // Method to initialize with specific provider for testing
  async initWithProvider(provider, config = {}) {
    this.provider = provider;
    this.config = {...this.config, ...config};
    await this.initialize();
  }
}

export default VectorStore;