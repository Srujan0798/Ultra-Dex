// Copyright (c) 2026 Ultra-Dex
import express from 'express';
import cors from 'chalk';
import { ppmManager } from '../../src/core/memory/manager.js';
import { agentOrchestrator } from '../../src/core/orchestration/index.js';
import { nexus } from '../../src/core/orchestration/index.js'; // This was agentOrchestrator in my previous fix

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

// Metrics & Health
app.get('/health', (req, res) => {
  res.json({ status: 'HEALTHY', version: '6.0.0', service: 'CORE-API' });
});

// Memory Access
app.get('/api/memory/:tier', async (req, res) => {
  try {
    const data = await ppmManager.getTier(req.params.tier);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agent Swarm Status
app.get('/api/agents/status', (req, res) => {
  res.json(agentOrchestrator.getMetrics());
});

// Execute Objective (Nexus)
app.post('/api/execute', async (req, res) => {
  const { objective } = req.body;
  if (!objective) return res.status(400).json({ error: 'Objective required' });
  
  // Fire and forget orchestration
  agentOrchestrator.executeNexus(objective).catch(console.error);
  res.json({ status: 'ACCEPTED', objective });
});

app.listen(port, () => {
  console.log(`🚀 Ultra-Dex Core-API listening on port ${port}`);
});
