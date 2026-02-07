// Copyright (c) 2026 Ultra-Dex

import { recordInteraction, listDatasets } from './dataset.js';

export async function startRecording(sessionId, metadata = {}) {
  const entry = {
    type: 'session_start',
    sessionId,
    metadata,
  };
  return recordInteraction(entry, metadata.dataset || 'default');
}

export async function stopRecording(sessionId, metadata = {}) {
  const entry = {
    type: 'session_end',
    sessionId,
    metadata,
  };
  return recordInteraction(entry, metadata.dataset || 'default');
}

export async function recordSample(sample, dataset = 'default') {
  return recordInteraction({ type: 'sample', ...sample }, dataset);
}

export async function listTrainingDatasets() {
  return listDatasets();
}

export default {
  startRecording,
  stopRecording,
  recordSample,
  listTrainingDatasets,
};
