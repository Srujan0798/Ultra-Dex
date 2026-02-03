# AI Research Guide

> Practical research notes for embedding models, vector databases, and RAG patterns.

---

## 1) Embedding Models Comparison

### Key Criteria
- **Quality:** semantic accuracy on your domain
- **Latency:** p95 response times
- **Cost:** per 1M tokens or per vector
- **Context fit:** supports long or multilingual inputs

### Common Options (2026 snapshot)
| Provider | Model Type | Strengths | Tradeoffs |
|---------|------------|-----------|-----------|
| OpenAI | Text embeddings | Strong general quality | Paid, rate limits |
| Cohere | Multilingual embeddings | Great cross-language retrieval | Cost at scale |
| SentenceTransformers | OSS embeddings | Free, local deployment | Lower quality vs top paid models |
| Voyage / Mistral / Gemini | Embeddings | Competitive quality | Varying SDK maturity |

### Selection Guidance
- **Prototype:** start with OpenAI embeddings for speed.
- **Cost-sensitive:** switch to open-source (BGE, E5) with local inference.
- **Multilingual:** prioritize Cohere or multilingual open-source (e.g., LaBSE).

---

## 2) Vector Databases (Pinecone vs Weaviate vs Chroma)

### Comparison Matrix
| Feature | Pinecone | Weaviate | Chroma |
|--------|----------|----------|--------|
| Hosting | Managed SaaS | Managed + OSS | Local/OSS (cloud optional) |
| Setup | Fast, no infra | Moderate | Easy local |
| Scale | Excellent | Strong | Limited for huge scale |
| Filtering | Strong metadata filters | Strong | Basic |
| Cost | Higher at scale | Mid | Lowest |
| Best For | Production SaaS | Hybrid teams | Prototyping |

### Recommendations
- **Production SaaS:** Pinecone for reliability + managed ops.
- **Hybrid/OSS:** Weaviate for control + flexibility.
- **Prototype/MVP:** Chroma for speed and simplicity.

---

## 3) RAG Implementation Patterns

### Pattern A: Basic RAG (Fast start)
- Chunk documents
- Embed chunks
- Retrieve top-k
- Inject into prompt

**Pros:** simple and fast
**Cons:** less precise without reranking

### Pattern B: RAG + Reranking (Higher precision)
- Retrieve top-20
- Rerank with cross-encoder
- Use top-5 for final prompt

**Pros:** better relevance
**Cons:** added latency/cost

### Pattern C: Hybrid Search (Keyword + Vector)
- Run keyword search in parallel
- Merge with vector results
- Deduplicate and rerank

**Pros:** great for exact terms
**Cons:** more infrastructure

### Pattern D: Multi-Query RAG
- Generate 3-5 query rewrites
- Retrieve for each query
- Aggregate + rerank

**Pros:** better recall
**Cons:** more embedding cost

---

## RAG Reference Architecture
1. **Ingestion** → chunk + embed
2. **Index** → vector store + metadata
3. **Retrieve** → top-k + filters
4. **Rerank** → cross-encoder
5. **Generate** → structured prompt with citations

---

## Common Pitfalls
- Chunks too large → poor retrieval
- No metadata filters → irrelevant results
- No evaluation → silent quality issues
- Over-reliance on top-1 → hallucinations

---

## Recommended Defaults
- Chunk size: 300–600 tokens
- Overlap: 10–20%
- Top-k: 5–10
- Rerank: yes for production
- Cache embeddings for repeated docs

---

## Next Steps
- Add evaluation with small test set.
- Track retrieval precision over time.
- Add observability for query latency and cost.
