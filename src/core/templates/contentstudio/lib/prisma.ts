/**
 * @fileoverview Prisma module
 * @module lib/prisma
 */

import type { Content, ContentVersion, Media } from './types';

// Prisma client type definition for templates
interface PrismaClient {
  content: {
    findFirst: (args: unknown) => Promise<Content | null>;
    findUnique: (args: unknown) => Promise<Content | null>;
    findMany: (args: unknown) => Promise<Content[]>;
    create: (args: unknown) => Promise<Content>;
    update: (args: unknown) => Promise<Content>;
    updateMany: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<Content>;
    deleteMany: (args: unknown) => Promise<unknown>;
    count: (args: unknown) => Promise<number>;
  };
  contentVersion: {
    findFirst: (args: unknown) => Promise<ContentVersion | null>;
    findUnique: (args: unknown) => Promise<ContentVersion | null>;
    findMany: (args: unknown) => Promise<ContentVersion[]>;
    create: (args: unknown) => Promise<ContentVersion>;
  };
  media: {
    findUnique: (args: unknown) => Promise<Media | null>;
    findMany: (args: unknown) => Promise<Media[]>;
    create: (args: unknown) => Promise<Media>;
    update: (args: unknown) => Promise<Media>;
    delete: (args: unknown) => Promise<Media>;
    deleteMany: (args: unknown) => Promise<unknown>;
    count: (args: unknown) => Promise<number>;
  };
}

declare const PrismaClient: new () => PrismaClient;
export const prisma = new PrismaClient();

/**
 * Error handler for prisma
 * @param {Error} error - Error to handle
 */
function handlePrismaError(error: Error | unknown) {
  try {
    console.error('[prisma]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
