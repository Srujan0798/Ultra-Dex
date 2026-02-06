import { v4 as uuid } from 'uuid';

const users = new Map();
const sessions = new Map();
const tasks = new Map();

export function createUser({ email, name }) {
  const id = uuid();
  const user = { id, email, name, createdAt: new Date().toISOString() };
  users.set(id, user);
  return user;
}

export function getUser(id) {
  return users.get(id);
}

export function createSession(userId) {
  const token = uuid();
  sessions.set(token, { token, userId, createdAt: new Date().toISOString() });
  return token;
}

export function getSession(token) {
  return sessions.get(token);
}

export function listTasks(userId) {
  return Array.from(tasks.values()).filter((task) => task.userId === userId);
}

export function addTask(userId, payload) {
  const id = uuid();
  const task = {
    id,
    userId,
    title: payload.title,
    status: payload.status || 'todo',
    createdAt: new Date().toISOString(),
  };
  tasks.set(id, task);
  return task;
}

export function updateTask(userId, taskId, payload) {
  const task = tasks.get(taskId);
  if (!task || task.userId !== userId) return null;
  const next = { ...task, ...payload, updatedAt: new Date().toISOString() };
  tasks.set(taskId, next);
  return next;
}

export function deleteTask(userId, taskId) {
  const task = tasks.get(taskId);
  if (!task || task.userId !== userId) return false;
  tasks.delete(taskId);
  return true;
}
