import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateReply, summarizeConversation } from './chatbot.js';

const app = express();
const port = process.env.PORT || 4010;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '..', 'public');

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(publicDir));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/chat', (req, res) => {
  const { message, history } = req.body || {};
  const reply = generateReply(message, Array.isArray(history) ? history : []);
  res.json({ reply, timestamp: new Date().toISOString() });
});

app.post('/api/summary', (req, res) => {
  const { history } = req.body || {};
  const summary = summarizeConversation(Array.isArray(history) ? history : []);
  res.json({ summary });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`AI Chatbot running on http://localhost:${port}`);
});
