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
let WinstonStyleLogger = class {
  config;
  logHistory = [];
  maxHistory = 1e3;
  constructor() {
    this.config = {
      level: process.env.LOG_LEVEL || "info",
      enableConsole: true,
      enableFile: false
    };
  }
  shouldLog(level) {
    const levels = ["debug", "info", "warn", "error", "fatal"];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }
  log(level, message, context, error) {
    if (!this.shouldLog(level))
      return;
    const entry = {
      level,
      message,
      timestamp: /* @__PURE__ */ new Date(),
      context,
      error
    };
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistory) {
      this.logHistory.shift();
    }
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }
  }
  writeToConsole(entry) {
    const timestamp = entry.timestamp.toISOString();
    const levelUpper = entry.level.toUpperCase().padEnd(5);
    let output = `[${timestamp}] ${levelUpper}: ${entry.message}`;
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${JSON.stringify(entry.context)}`;
    }
    if (entry.error) {
      output += `
${entry.error.stack || entry.error.message}`;
    }
    switch (entry.level) {
      case "debug":
        console.debug(output);
        break;
      case "info":
        console.info(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "error":
      case "fatal":
        console.error(output);
        break;
    }
  }
  debug(message, context) {
    this.log("debug", message, context);
  }
  info(message, context) {
    this.log("info", message, context);
  }
  warn(message, context) {
    this.log("warn", message, context);
  }
  error(message, error, context) {
    this.log("error", message, context, error);
  }
  fatal(message, error, context) {
    this.log("fatal", message, context, error);
  }
  child(metadata) {
    const childLogger = new WinstonStyleLogger();
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level, message, context, error) => {
      originalLog(level, message, { ...metadata, ...context }, error);
    };
    return childLogger;
  }
  getHistory(filter) {
    let result = this.logHistory;
    if (filter?.level) {
      result = result.filter((e) => e.level === filter.level);
    }
    if (filter?.since) {
      result = result.filter((e) => e.timestamp >= filter.since);
    }
    return result;
  }
};
WinstonStyleLogger = __decorateClass([
  singleton()
], WinstonStyleLogger);
export {
  WinstonStyleLogger
};
