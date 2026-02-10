// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Fine Tune module
 * @module training/fine-tune
 */

import fs from 'fs/promises';
import path from 'path';
import { ensureTrainingDir } from './dataset.js';

const JOBS_FILE = path.join(process.cwd(), '.ultra-dex', 'training', 'jobs.json');

async function loadJobs() {
  try {
    const content = await fs.readFile(JOBS_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function saveJobs(jobs) {
  await ensureTrainingDir();
  await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

export async function startFineTune({ dataset = 'default', provider = 'openai', model } = {}) {
  const jobs = await loadJobs();
  const job = {
    id: `job_${Date.now()}`,
    dataset,
    provider,
    model: model || 'baseline',
    status: 'queued',
    createdAt: new Date().toISOString(),
  };
  jobs.push(job);
  await saveJobs(jobs);
  return job;
}

export async function updateJobStatus(jobId, status) {
  const jobs = await loadJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) throw new Error('Training job not found');
  job.status = status;
  job.updatedAt = new Date().toISOString();
  await saveJobs(jobs);
  return job;
}

export async function listJobs() {
  return loadJobs();
}

export default {
  startFineTune,
  updateJobStatus,
  listJobs,
};
