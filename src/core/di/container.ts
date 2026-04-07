import "reflect-metadata";
import {
  container as tsyringeContainer,
  instanceCachingFactory,
  instancePerContainerCachingFactory
} from "tsyringe";
import { DI_TOKENS } from './tokens.js';
const container = tsyringeContainer.createChildContainer();
function normalizeOverrides(overrides) {
  if (!overrides) {
    return [];
  }
  if (overrides instanceof Map) {
    return Array.from(overrides.entries());
  }
  if (Array.isArray(overrides)) {
    return overrides;
  }
  return Reflect.ownKeys(overrides).map((key) => [key, overrides[key]]);
}
function isRegistered(token, targetContainer = container) {
  return targetContainer.isRegistered(token, true);
}
function registerSingleton(token, factory, targetContainer = container) {
  if (!isRegistered(token, targetContainer)) {
    targetContainer.register(token, {
      useFactory: instanceCachingFactory(factory)
    });
  }
  return token;
}
function registerScoped(token, factory, targetContainer = container) {
  if (!isRegistered(token, targetContainer)) {
    targetContainer.register(token, {
      useFactory: instancePerContainerCachingFactory(factory)
    });
  }
  return token;
}
function registerAlias(token, useToken, targetContainer = container) {
  if (!isRegistered(token, targetContainer)) {
    targetContainer.register(token, { useToken });
  }
  return token;
}
function resolveFromContainer(token, targetContainer = container) {
  return targetContainer.resolve(token);
}
function resolveOptional(token, targetContainer = container) {
  if (!isRegistered(token, targetContainer)) {
    return null;
  }
  return targetContainer.resolve(token);
}
function registerInstance(token, value, targetContainer = container) {
  targetContainer.registerInstance(token, value);
  return value;
}
function createSessionContainer(sessionId, overrides = []) {
  const sessionContainer = container.createChildContainer();
  sessionContainer.register(DI_TOKENS.sessionId, { useValue: sessionId });
  for (const [token, value] of normalizeOverrides(overrides)) {
    sessionContainer.registerInstance(token, value);
  }
  const originalResolve = sessionContainer.resolve.bind(sessionContainer);
  sessionContainer.resolve = (token) => {
    if (typeof token === "function" && token.name === "AgentOrchestrator") {
      const options = {
        sessionId,
        memory: resolveOptional(DI_TOKENS.memoryManager, sessionContainer) || void 0,
        registry: resolveOptional(DI_TOKENS.agentRegistry, sessionContainer) || void 0,
        ai: resolveOptional(DI_TOKENS.aiMetaLayer, sessionContainer) || void 0,
        telemetry: resolveOptional(DI_TOKENS.telemetryService, sessionContainer) || void 0
      };
      return new token(options);
    }
    return originalResolve(token);
  };
  return sessionContainer;
}
export {
  container,
  createSessionContainer,
  isRegistered,
  registerAlias,
  registerInstance,
  registerScoped,
  registerSingleton,
  resolveFromContainer,
  resolveOptional
};
