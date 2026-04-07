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
let ConfigService = class extends EventEmitter {
  config = /* @__PURE__ */ new Map();
  watchers = /* @__PURE__ */ new Map();
  constructor() {
    super();
    this.loadFromEnvironment();
  }
  loadFromEnvironment() {
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith("ULTRA_DEX_")) {
        const configKey = key.replace("ULTRA_DEX_", "").toLowerCase().replace(/_/g, ".");
        this.set(configKey, this.parseValue(value));
      }
    }
  }
  parseValue(value) {
    if (value === void 0)
      return null;
    if (value === "true")
      return true;
    if (value === "false")
      return false;
    if (/^\d+$/.test(value))
      return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value))
      return parseFloat(value);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  get(key, defaultValue) {
    const value = this.config.get(key);
    if (value === void 0) {
      if (defaultValue !== void 0) {
        return defaultValue;
      }
      throw new Error(`Config key not found: ${key}`);
    }
    return value;
  }
  set(key, value) {
    const oldValue = this.config.get(key);
    this.config.set(key, value);
    const watchers = this.watchers.get(key);
    if (watchers) {
      watchers.forEach((callback) => callback(value));
    }
    this.emit("change", { key, value, oldValue });
  }
  has(key) {
    return this.config.has(key);
  }
  async load(source) {
    switch (source.type) {
      case "file":
        await this.loadFromFile(source.path);
        break;
      case "env":
        this.loadFromEnvironment();
        break;
      case "remote":
        await this.loadFromRemote(source.url, source.refreshInterval);
        break;
    }
  }
  async loadFromFile(filePath) {
    const fs = await import("fs/promises");
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);
    this.mergeConfig("", data);
  }
  mergeConfig(prefix, data) {
    for (const [key, value] of Object.entries(data)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        this.mergeConfig(fullKey, value);
      } else {
        this.set(fullKey, value);
      }
    }
  }
  async loadFromRemote(url, refreshInterval) {
    const response = await fetch(url);
    const data = await response.json();
    this.mergeConfig("", data);
    if (refreshInterval) {
      setInterval(() => this.loadFromRemote(url), refreshInterval);
    }
  }
  watch(key, callback) {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, /* @__PURE__ */ new Set());
    }
    this.watchers.get(key).add(callback);
  }
  unwatch(key, callback) {
    const watchers = this.watchers.get(key);
    if (watchers) {
      watchers.delete(callback);
    }
  }
  getAll() {
    return Object.fromEntries(this.config);
  }
};
ConfigService = __decorateClass([
  singleton()
], ConfigService);
export {
  ConfigService
};
