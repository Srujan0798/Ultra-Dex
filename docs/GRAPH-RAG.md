# Deep Graph RAG Implementation

This document describes the Deep Graph RAG (Retrieval-Augmented Generation) implementation in Ultra-Dex.

## Overview

The Deep Graph RAG system provides graph-based context storage and retrieval for AI agents. It replaces or enhances file-based context with a Neo4j graph database backend, enabling sophisticated relationship mapping and impact analysis.

## Features

### 1. Neo4j Integration
- Automatic connection to Neo4j database (configurable via environment variables)
- Graceful fallback to in-memory storage when Neo4j is unavailable
- Schema initialization with constraints and indexes

### 2. Relationship Mapping
- Maps relationships between files (imports/dependencies)
- Extracts and indexes functions, classes, and data types
- Tracks architectural decisions and their affected files

### 3. Impact Analysis Queries
- **"What breaks if I change X?"** - Transitive dependency analysis
- Function-level impact tracking
- Risk level assessment (low/medium/high)
- Related architectural decisions

### 4. Graph-Based Context
- ContextEngine for building rich context from graph queries
- Replaces file-based context with semantic graph retrieval
- Supports natural language queries

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ContextEngine                        │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │  Query Parser   │───▶│    GraphRAG (Neo4j)         │ │
│  └─────────────────┘    └─────────────────────────────┘ │
│           │                           │                 │
│           ▼                           ▼                 │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │ Impact Analysis │    │  Relationship Mapping       │ │
│  └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Environment Variables

```bash
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
```

## Usage

### Basic Graph Scan

```javascript
import { projectGraph } from './lib/mcp/graph.js';

// Initialize and scan
await projectGraph.scan();

// Get impact analysis
const impact = await projectGraph.getImpactAnalysis('src/auth.js');
console.log(impact.riskLevel); // 'high', 'medium', or 'low'
console.log(impact.impactedFiles); // Array of affected files
```

### Context Engine

```javascript
import { contextEngine } from './lib/mcp/context-engine.js';

// Initialize
await contextEngine.initialize();

// Build context for a file
const context = await contextEngine.buildContext('src/api/users.js', {
  includeImpact: true,
  includeCoupling: true,
  depth: 2
});

// Natural language query
const result = await contextEngine.query('What breaks if I change the auth module?');
console.log(result.answer);
```

### MCP Tools

New MCP tools available:

- `deep_impact_analysis` - Deep impact analysis using graph database
- `find_circular_deps` - Detect circular dependencies
- `get_coupling_metrics` - Analyze code coupling
- `graph_rag_query` - General graph RAG queries
- `store_decision` - Store architectural decisions
- `search_symbols` - Search for functions and symbols

## Graph Schema

### Nodes

- **File**: Represents a source file
  - `path`: File path (unique)
  - `type`: File extension (js, ts, etc.)
  - `size`: File size
  - `symbols`: Array of exported symbols
  
- **Function**: Represents a function or method
  - `name`: Function name
  - `file`: Containing file
  
- **DataType**: Represents classes, interfaces, types
  - `name`: Type name
  - `kind`: 'class', 'interface', etc.
  
- **Decision**: Represents an architectural decision
  - `title`: Decision title
  - `description`: Full description
  - `status`: active, deprecated, superseded

### Relationships

- `DEPENDS_ON`: File A depends on File B
- `CONTAINS`: File contains Function
- `AFFECTS`: Decision affects File

## Impact Analysis Algorithm

1. Start from the target file
2. Traverse dependency graph backwards (who depends on this file?)
3. Continue transitively up to configured depth
4. Calculate risk level based on number of impacted files
5. Include related architectural decisions
6. Optionally include function-level impacts

## Migration from File-Based Context

The system maintains backward compatibility:

1. **In-Memory Graph**: Always available as fallback
2. **GraphRAG Integration**: Automatically syncs in-memory graph to Neo4j
3. **Graceful Degradation**: Works without Neo4j, just with reduced capabilities

To migrate existing projects:

```bash
# Set up Neo4j (Docker example)
docker run -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest

# Run Ultra-Dex scan (auto-syncs to Neo4j)
ultra-dex scan
```

## Performance Considerations

- **Batch Processing**: File analysis and graph sync happen in batches (100 items)
- **Caching**: In-memory cache with 30-second TTL
- **Incremental Updates**: Only changed files are re-analyzed
- **Async Operations**: Graph sync happens asynchronously

## Future Enhancements

- [ ] Vector embeddings for semantic search
- [ ] LangChain integration for complex queries
- [ ] FalkorDB support as alternative to Neo4j
- [ ] Real-time graph updates via file watchers
- [ ] Visualization dashboard for graph exploration

## Troubleshooting

### Neo4j Connection Issues

```bash
# Verify Neo4j is running
curl http://localhost:7474

# Check connection with cypher-shell
cypher-shell -u neo4j -p password "MATCH (n) RETURN count(n)"
```

### Fallback Mode

If Neo4j is unavailable, the system automatically falls back to in-memory storage. Check logs:

```
[GraphRAG] Failed to connect to Neo4j: Error message
[GraphRAG] Falling back to in-memory graph storage
```

## References

- docs/REVIEW-SUMMARY.md (lines 69-84)
- cli/lib/mcp/graph.js
- cli/lib/mcp/context-engine.js
