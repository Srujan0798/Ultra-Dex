import express from 'express';
import cors from 'cors';
import { createUser, createSession, getSession, getUser, listTasks, addTask, updateTask, deleteTask } from './store.js';

const app = express();
const port = process.env.PORT || 4020;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = getUser(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  req.user = user;
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', (req, res) => {
  const { email, name } = req.body || {};
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }
  const user = createUser({ email, name });
  const token = createSession(user.id);
  res.status(201).json({ user, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const user = createUser({ email, name: email.split('@')[0] });
  const token = createSession(user.id);
  res.json({ user, token });
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/tasks', authMiddleware, (req, res) => {
  res.json({ tasks: listTasks(req.user.id) });
});

app.post('/api/tasks', authMiddleware, (req, res) => {
  const { title, status } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }
  const task = addTask(req.user.id, { title, status });
  res.status(201).json({ task });
});

app.patch('/api/tasks/:id', authMiddleware, (req, res) => {
  const task = updateTask(req.user.id, req.params.id, req.body || {});
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({ task });
});

app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
  const ok = deleteTask(req.user.id, req.params.id);
  if (!ok) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Mobile backend running on http://localhost:${port}`);
});
