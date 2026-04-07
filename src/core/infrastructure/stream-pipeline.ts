var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { EventEmitter } from "events";
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function normalizeOutputs(result, fallbackValue) {
  if (result === null || result === false) {
    return [];
  }
  if (typeof result === "undefined") {
    return typeof fallbackValue === "undefined" ? [] : [fallbackValue];
  }
  return Array.isArray(result) ? result : [result];
}
function cloneSeed(seed) {
  if (typeof seed === "function") {
    return seed();
  }
  if (Array.isArray(seed)) {
    return [...seed];
  }
  if (seed && typeof seed === "object") {
    return { ...seed };
  }
  return seed;
}
function chunkToText(chunk) {
  if (typeof chunk === "string") {
    return chunk;
  }
  if (typeof chunk?.text === "string") {
    return chunk.text;
  }
  if (typeof chunk?.content === "string") {
    return chunk.content;
  }
  if (typeof chunk?.delta === "string") {
    return chunk.delta;
  }
  return "";
}
function decorateChunk(chunk, patch) {
  if (chunk && typeof chunk === "object" && !Array.isArray(chunk)) {
    return { ...chunk, ...patch };
  }
  if (patch && typeof patch === "object" && !Array.isArray(patch)) {
    return { ...patch };
  }
  return patch;
}
async function* readableStreamToAsyncIterable(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
async function* toAsyncIterable(input) {
  const resolvedInput = await input;
  if (resolvedInput == null) {
    return;
  }
  if (typeof resolvedInput?.getReader === "function") {
    yield* readableStreamToAsyncIterable(resolvedInput);
    return;
  }
  if (typeof resolvedInput?.[Symbol.asyncIterator] === "function") {
    yield* resolvedInput;
    return;
  }
  if (typeof resolvedInput === "string") {
    yield resolvedInput;
    return;
  }
  if (typeof resolvedInput?.[Symbol.iterator] === "function") {
    yield* resolvedInput;
    return;
  }
  yield resolvedInput;
}
let StreamTransform = class {
  constructor({
    name = "transform",
    transform = null,
    filter = null,
    initialize = null,
    flush = null,
    errorHandler = null
  } = {}) {
    this.name = name;
    this.transform = transform;
    this.filter = filter;
    this.initialize = initialize;
    this.flushHandler = flush;
    this.errorHandler = errorHandler;
    this.stats = {
      processed: 0,
      emitted: 0,
      filtered: 0,
      flushed: 0,
      errors: 0,
      totalMs: 0
    };
  }
  createState(metadata = {}) {
    return typeof this.initialize === "function" ? this.initialize(metadata) || {} : {};
  }
  async process(chunk, runtime = {}) {
    const startedAt = Date.now();
    try {
      if (this.filter && !await this.filter(chunk, runtime)) {
        this.stats.filtered++;
        this.stats.totalMs += Date.now() - startedAt;
        return [];
      }
      const transformed = this.transform ? await this.transform(chunk, runtime) : chunk;
      const outputs = normalizeOutputs(transformed, chunk);
      this.stats.processed++;
      this.stats.emitted += outputs.length;
      this.stats.totalMs += Date.now() - startedAt;
      return outputs;
    } catch (error) {
      this.stats.errors++;
      this.stats.totalMs += Date.now() - startedAt;
      if (!this.errorHandler) {
        throw error;
      }
      const recovered = await this.errorHandler(error, chunk, runtime);
      const outputs = normalizeOutputs(recovered);
      this.stats.emitted += outputs.length;
      return outputs;
    }
  }
  async flush(runtime = {}) {
    if (!this.flushHandler) {
      return [];
    }
    const startedAt = Date.now();
    try {
      const flushed = await this.flushHandler(runtime);
      const outputs = normalizeOutputs(flushed);
      this.stats.flushed++;
      this.stats.emitted += outputs.length;
      this.stats.totalMs += Date.now() - startedAt;
      return outputs;
    } catch (error) {
      this.stats.errors++;
      this.stats.totalMs += Date.now() - startedAt;
      throw error;
    }
  }
  getStats() {
    const completed = this.stats.processed + this.stats.flushed;
    return {
      name: this.name,
      ...this.stats,
      avgMs: completed > 0 ? Math.round(this.stats.totalMs / completed) : 0
    };
  }
  static map(name, transform) {
    return new StreamTransform({ name, transform });
  }
  static filter({ name = "filter", predicate }) {
    return new StreamTransform({
      name,
      filter: predicate,
      transform: (chunk) => chunk
    });
  }
  static tokenize({
    name = "tokenize",
    includeWhitespace = false,
    extractor = chunkToText,
    mapper = null
  } = {}) {
    return new StreamTransform({
      name,
      transform: (chunk) => {
        const text = extractor(chunk);
        if (!text) {
          return [];
        }
        const tokens = includeWhitespace ? String(text).match(/\S+|\s+/g) || [] : String(text).split(/\s+/).map((token) => token.trim()).filter(Boolean);
        return tokens.map((token, index) => {
          if (typeof mapper === "function") {
            return mapper(token, chunk, index);
          }
          return decorateChunk(chunk, {
            type: "token",
            token,
            text: token,
            content: token,
            index
          });
        });
      }
    });
  }
  static aggregate({
    name = "aggregate",
    seed = "",
    reducer = (accumulator, chunk) => `${accumulator}${chunkToText(chunk)}`,
    emit = "final",
    project = (value) => ({ type: "aggregate", text: value, content: value })
  } = {}) {
    return new StreamTransform({
      name,
      initialize: () => ({ accumulator: cloneSeed(seed) }),
      transform: async (chunk, runtime) => {
        runtime.state.accumulator = await reducer(runtime.state.accumulator, chunk, runtime);
        if (emit === "cumulative") {
          return project(runtime.state.accumulator, chunk, runtime);
        }
        return [];
      },
      flush: (runtime) => {
        if (emit !== "final") {
          return [];
        }
        return project(runtime.state.accumulator, null, runtime);
      }
    });
  }
};
StreamTransform = __decorateClass([
  singleton()
], StreamTransform);
let StreamBuffer = class {
  constructor({
    name = "buffer",
    maxItems = 10,
    flushIntervalMs = 0,
    formatter = null
  } = {}) {
    this.name = name;
    this.maxItems = maxItems;
    this.flushIntervalMs = flushIntervalMs;
    this.formatter = formatter;
    this.stats = {
      processed: 0,
      emitted: 0,
      flushes: 0,
      errors: 0,
      totalMs: 0
    };
  }
  createState() {
    return {
      items: [],
      openedAt: 0
    };
  }
  async process(chunk, runtime = {}) {
    const startedAt = Date.now();
    try {
      if (!runtime.state.openedAt) {
        runtime.state.openedAt = Date.now();
      }
      runtime.state.items.push(chunk);
      this.stats.processed++;
      this.stats.totalMs += Date.now() - startedAt;
      const shouldFlushBySize = runtime.state.items.length >= this.maxItems;
      const shouldFlushByTime = this.flushIntervalMs > 0 && Date.now() - runtime.state.openedAt >= this.flushIntervalMs;
      if (!shouldFlushBySize && !shouldFlushByTime) {
        return [];
      }
      return await this.flush(runtime);
    } catch (error) {
      this.stats.errors++;
      this.stats.totalMs += Date.now() - startedAt;
      throw error;
    }
  }
  async flush(runtime = {}) {
    const startedAt = Date.now();
    try {
      if (!runtime.state.items.length) {
        return [];
      }
      const batch = [...runtime.state.items];
      runtime.state.items = [];
      runtime.state.openedAt = 0;
      const formatted = this.formatter ? await this.formatter(batch, runtime) : {
        type: "buffer",
        size: batch.length,
        items: batch
      };
      const outputs = normalizeOutputs(formatted);
      this.stats.flushes++;
      this.stats.emitted += outputs.length;
      this.stats.totalMs += Date.now() - startedAt;
      return outputs;
    } catch (error) {
      this.stats.errors++;
      this.stats.totalMs += Date.now() - startedAt;
      throw error;
    }
  }
  getStats() {
    const completed = this.stats.processed + this.stats.flushes;
    return {
      name: this.name,
      maxItems: this.maxItems,
      flushIntervalMs: this.flushIntervalMs,
      ...this.stats,
      avgMs: completed > 0 ? Math.round(this.stats.totalMs / completed) : 0
    };
  }
};
StreamBuffer = __decorateClass([
  singleton()
], StreamBuffer);
let StreamPipeline = class extends EventEmitter {
  constructor({ name = "ai-response-stream", autoStart = true } = {}) {
    super();
    this.name = name;
    this.running = autoStart;
    this.stages = [];
    this.stats = {
      streamsStarted: 0,
      streamsCompleted: 0,
      activeStreams: 0,
      inputChunks: 0,
      outputChunks: 0,
      filteredChunks: 0,
      errors: 0,
      cancelled: 0
    };
  }
  normalizeStage(stage) {
    if (stage instanceof StreamTransform || stage instanceof StreamBuffer) {
      return stage;
    }
    if (stage?.type === "tokenize") {
      return StreamTransform.tokenize(stage);
    }
    if (stage?.type === "filter") {
      return StreamTransform.filter({
        name: stage.name,
        predicate: stage.predicate || stage.filter
      });
    }
    if (stage?.type === "aggregate") {
      return StreamTransform.aggregate(stage);
    }
    if (stage?.type === "buffer") {
      return new StreamBuffer(stage);
    }
    return new StreamTransform(stage);
  }
  addStage(stage) {
    this.stages.push(this.normalizeStage(stage));
    return this;
  }
  addTransform(stage) {
    return this.addStage(stage);
  }
  addBuffer(name, config = {}) {
    return this.addStage(new StreamBuffer({ name, ...config }));
  }
  start() {
    this.running = true;
    return this;
  }
  async stop() {
    this.running = false;
  }
  async runStages(chunks, startIndex, runtimeStates, metadata) {
    let current = Array.isArray(chunks) ? chunks : [chunks];
    for (let stageIndex = startIndex; stageIndex < this.stages.length; stageIndex++) {
      const stage = this.stages[stageIndex];
      const stageState = runtimeStates[stageIndex];
      const next = [];
      for (const chunk of current) {
        const outputs = await stage.process(chunk, {
          pipeline: this,
          metadata,
          stageIndex,
          state: stageState,
          stage
        });
        if (!outputs.length) {
          this.stats.filteredChunks++;
        }
        next.push(...outputs);
      }
      current = next;
      if (!current.length) {
        break;
      }
    }
    return current;
  }
  pipe(input, metadata = {}) {
    const pipeline = this;
    pipeline.running = true;
    return new ReadableStream({
      async start(controller) {
        const runtimeStates = pipeline.stages.map((stage) => stage.createState(metadata));
        pipeline.stats.streamsStarted++;
        pipeline.stats.activeStreams++;
        pipeline.emit("stream:start", { name: pipeline.name, metadata });
        try {
          for await (const chunk of toAsyncIterable(input)) {
            if (!pipeline.running) {
              break;
            }
            pipeline.stats.inputChunks++;
            const outputs = pipeline.stages.length ? await pipeline.runStages(chunk, 0, runtimeStates, metadata) : [chunk];
            for (const output of outputs) {
              pipeline.stats.outputChunks++;
              pipeline.emit("chunk:output", { chunk: output, metadata });
              controller.enqueue(output);
            }
          }
          for (let stageIndex = 0; stageIndex < pipeline.stages.length; stageIndex++) {
            const stage = pipeline.stages[stageIndex];
            const stageState = runtimeStates[stageIndex];
            const flushed = await stage.flush({
              pipeline,
              metadata,
              stageIndex,
              state: stageState,
              stage
            });
            if (!flushed.length) {
              continue;
            }
            const outputs = await pipeline.runStages(
              flushed,
              stageIndex + 1,
              runtimeStates,
              metadata
            );
            for (const output of outputs) {
              pipeline.stats.outputChunks++;
              pipeline.emit("chunk:output", { chunk: output, metadata, flushed: true });
              controller.enqueue(output);
            }
          }
          controller.close();
          pipeline.stats.streamsCompleted++;
          pipeline.emit("stream:complete", { name: pipeline.name, metadata });
        } catch (error) {
          pipeline.stats.errors++;
          pipeline.emit("stream:error", { error, metadata });
          controller.error(error);
        } finally {
          pipeline.stats.activeStreams = Math.max(0, pipeline.stats.activeStreams - 1);
        }
      },
      async cancel(reason) {
        pipeline.stats.cancelled++;
        pipeline.emit("stream:cancel", { reason, name: pipeline.name, metadata });
        await delay(0);
      }
    });
  }
  getStats() {
    return {
      name: this.name,
      running: this.running,
      ...this.stats,
      stages: this.stages.map((stage) => stage.getStats())
    };
  }
  getDashboard() {
    return this.getStats();
  }
};
StreamPipeline = __decorateClass([
  singleton()
], StreamPipeline);
var stream_pipeline_default = StreamPipeline;
export {
  StreamBuffer,
  StreamPipeline,
  StreamTransform,
  stream_pipeline_default as default
};
