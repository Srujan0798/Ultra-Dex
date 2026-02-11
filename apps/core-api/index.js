// Copyright (c) 2026 Ultra-Dex
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { ppmManager } from '../../src/core/memory/manager.js';
import { agentOrchestrator } from '../../src/core/orchestration/index.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// WebSocket Broadcast Logic
const broadcast = (data) => {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Listen for agent events
agentOrchestrator.stateMachine?.on('transition', (state) => {
  broadcast({ type: 'system_update', data: { state } });
});

wss.on('connection', (ws) => {
  console.log('🔌 Dashboard connected via WebSocket');
  ws.send(JSON.stringify({ type: 'initial_state', data: agentOrchestrator.getMetrics() }));
});

// REST Endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'HEALTHY', version: '6.0.0', service: 'CORE-API' });
});

app.get('/api/memory/:tier', async (req, res) => {
  try {
    const data = await ppmManager.getTier(req.params.tier);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/execute', async (req, res) => {
  const { objective } = req.body;
  if (!objective) return res.status(400).json({ error: 'Objective required' });
  
  broadcast({ type: 'task_started', data: { objective } });
  agentOrchestrator.executeNexus(objective).then(result => {
    broadcast({ type: 'task_completed', data: { objective, result } });
  }).catch(err => {
    broadcast({ type: 'task_failed', data: { objective, error: err.message } });
  });

  res.json({ status: 'ACCEPTED', objective });
});

server.listen(port, () => {
  console.log(`🚀 Ultra-Dex Core-API (Express + WS) listening on port ${port}`);
});