import pino from 'pino';
import { config } from './index';

export const logger = pino({
  level: config.logging.level,
  transport:
    config.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: {
    env: config.nodeEnv,
    version: process.env.npm_package_version,
  },
});

export const createChildLogger = (bindings: Record<string, unknown>) => {
  return logger.child(bindings);
};
