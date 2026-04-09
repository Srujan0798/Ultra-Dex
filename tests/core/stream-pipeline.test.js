import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  StreamBuffer,
  StreamPipeline,
  StreamTransform,
} from '../../src/core/infrastructure/stream-pipeline.js';
import { AIMetaLayer } from '../../src/core/ai/ai-meta-layer.js';

async function collectReadableStream(stream) {
  const reader = stream.getReader();
  const chunks = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    chunks.push(value);
  }

  return chunks;
}

describe('StreamPipeline', () => {
  it('tokenizes and filters provider chunks', async () => {
    const pipeline = new StreamPipeline({ name: 'tokenize-filter' });
    pipeline.addStage({ type: 'tokenize' });
    pipeline.addStage({
      type: 'filter',
      name: 'drop-skip',
      predicate: (chunk) => chunk.text !== 'skip',
    });

    const output = await collectReadableStream(
      pipeline.pipe([{ text: 'alpha skip beta' }], { provider: 'mock' })
    );

    assert.deepEqual(
      output.map((chunk) => chunk.text),
      ['alpha', 'beta']
    );
    assert.equal(pipeline.getStats().outputChunks, 2);
  });

  it('buffers chunks before emitting batches', async () => {
    const pipeline = new StreamPipeline({ name: 'buffered' });
    pipeline.addStage(
      new StreamBuffer({
        name: 'pair-buffer',
        maxItems: 2,
        formatter: (batch) => ({
          type: 'buffer',
          size: batch.length,
          text: batch.map((chunk) => chunk.text).join(' '),
        }),
      })
    );

    const output = await collectReadableStream(
      pipeline.pipe([{ text: 'one' }, { text: 'two' }, { text: 'three' }])
    );

    assert.deepEqual(
      output.map((chunk) => chunk.text),
      ['one two', 'three']
    );
    assert.equal(pipeline.getStats().stages[0].flushes, 2);
  });

  it('aggregates the full stream into a final chunk', async () => {
    const pipeline = new StreamPipeline({ name: 'aggregate' });
    pipeline.addStage(
      StreamTransform.aggregate({
        name: 'join',
        seed: '',
        reducer: (accumulator, chunk) =>
          accumulator ? `${accumulator}|${chunk.text}` : chunk.text,
        project: (value) => ({ type: 'aggregate', text: value, content: value }),
      })
    );

    const output = await collectReadableStream(
      pipeline.pipe([{ text: 'one' }, { text: 'two' }, { text: 'three' }])
    );

    assert.deepEqual(output, [
      { type: 'aggregate', text: 'one|two|three', content: 'one|two|three' },
    ]);
  });

  it('pipes AIMetaLayer provider streams through the configured pipeline', async () => {
    const pipeline = new StreamPipeline({ name: 'ai-stream' });
    pipeline.addStage(
      StreamTransform.map('uppercase', (chunk) => ({
        ...chunk,
        text: String(chunk.text || chunk.content || '').toUpperCase(),
      }))
    );

    const ai = new AIMetaLayer({
      mockMode: true,
      streamPipeline: pipeline,
    });

    const stream = await ai.stream('mock-model', [{ role: 'user', content: 'stream something' }]);
    const output = await collectReadableStream(stream);

    assert.equal(typeof stream.getReader, 'function');
    assert.deepEqual(
      output.map((chunk) => chunk.text),
      ['MOCK ', 'STREAM ', 'RESPONSE']
    );
    assert.equal(pipeline.getStats().streamsCompleted, 1);
  });
});
