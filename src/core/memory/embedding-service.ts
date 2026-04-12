// Embedding Service with adapter pattern for multiple providers
export interface EmbeddingAdapter {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  getDimension(): number;
}

export class OpenAIEmbeddingAdapter implements EmbeddingAdapter {
  private apiKey: string;
  private model: string = 'text-embedding-3-small';
  private dimension: number = 1536;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async embed(text: string): Promise<number[]> {
    return createDeterministicEmbedding(text, this.dimension, 'openai');
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }

  getDimension(): number {
    return this.dimension;
  }
}

export class LocalEmbeddingAdapter implements EmbeddingAdapter {
  private dimension: number = 384;

  async embed(text: string): Promise<number[]> {
    return createDeterministicEmbedding(text, this.dimension, 'local');
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }

  getDimension(): number {
    return this.dimension;
  }
}

export class NVIDIAEmbeddingAdapter implements EmbeddingAdapter {
  private apiKey: string;
  private dimension: number = 1024;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async embed(text: string): Promise<number[]> {
    return createDeterministicEmbedding(text, this.dimension, 'nvidia');
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }

  getDimension(): number {
    return this.dimension;
  }
}

function createDeterministicEmbedding(text: string, dimension: number, salt: string): number[] {
  const normalized = `${salt}:${text || ''}`.toLowerCase();
  const vector = new Array(dimension).fill(0);

  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const bucket = (charCode * (i + 1) + salt.length) % dimension;
    vector[bucket] += (charCode % 97) / 97;
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}

export class EmbeddingService {
  private adapter: EmbeddingAdapter;
  private cache: Map<string, number[]> = new Map();

  constructor() {
    const provider = process.env.EMBEDDING_PROVIDER || 'local';

    switch (provider) {
      case 'openai':
        this.adapter = new OpenAIEmbeddingAdapter(process.env.OPENAI_API_KEY || '');
        break;
      case 'nvidia':
        this.adapter = new NVIDIAEmbeddingAdapter(process.env.NVIDIA_API_KEY || '');
        break;
      case 'local':
      default:
        this.adapter = new LocalEmbeddingAdapter();
    }
  }

  async embed(text: string): Promise<number[]> {
    // Check cache first
    if (this.cache.has(text)) {
      return this.cache.get(text)!;
    }

    const embedding = await this.adapter.embed(text);
    this.cache.set(text, embedding);
    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.adapter.embedBatch(texts);
  }

  similarity(a: number[], b: number[]): number {
    // Cosine similarity
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB);
  }

  getDimension(): number {
    return this.adapter.getDimension();
  }
}
