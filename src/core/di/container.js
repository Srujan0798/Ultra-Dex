import 'reflect-metadata';
import {
  container as tsyringeContainer,
  instanceCachingFactory,
  instancePerContainerCachingFactory,
} from 'tsyringe';
import { DI_TOKENS } from './tokens.js';

export const container = tsyringeContainer.createChildContainer();

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

export function isRegistered(token, targetContainer = container) {
  return targetContainer.isRegistered(token, true);
}

export function registerSingleton(token, factory, targetContainer = container) {
  if (!isRegistered(token, targetContainer)) {
    targetContainer.register(token, {
      useFactory: instanceCachingFactory(factory),
    });
  }

  return token;
}

export function registerScoped(token, factory, targetContainer = container) {
  if (!isRegistered(token, targetContainer)) {
    targetContainer.register(token, {
      useFactory: instancePerContainerCachingFactory(factory),
    });
  }

  return token;
}

export function registerAlias(token, useToken, targetContainer = container) {
  if (!isRegistered(token, targetContainer)) {
    targetContainer.register(token, { useToken });
  }

  return token;
}

export function resolveFromContainer(token, targetContainer = container) {
  return targetContainer.resolve(token);
}

export function resolveOptional(token, targetContainer = container) {
  if (!isRegistered(token, targetContainer)) {
    return null;
  }

  return targetContainer.resolve(token);
}

export function registerInstance(token, value, targetContainer = container) {
  targetContainer.registerInstance(token, value);
  return value;
}

export function createSessionContainer(sessionId, overrides = []) {
  const sessionContainer = container.createChildContainer();
  sessionContainer.register(DI_TOKENS.sessionId, { useValue: sessionId });

  for (const [token, value] of normalizeOverrides(overrides)) {
    sessionContainer.registerInstance(token, value);
  }

  return sessionContainer;
}
