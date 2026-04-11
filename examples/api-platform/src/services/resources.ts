/**
 * @fileoverview Resources module
 * @module services/resources
 */

import { v4 as uuidv4 } from 'uuid';

interface Resource {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface CreateResourceInput {
  userId: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface UpdateResourceInput {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'archived';
  metadata?: Record<string, unknown>;
}

interface ListResourcesResult {
  data: Resource[];
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

// In-memory store for demo (replace with database in production)
const resourcesStore: Map<string, Resource> = new Map();

export class ResourceService {
  async createResource(input: CreateResourceInput): Promise<Resource> {
    const now = new Date().toISOString();
    const resource: Resource = {
      id: `res_${uuidv4().replace(/-/g, '')}`,
      userId: input.userId,
      name: input.name,
      description: input.description,
      status: 'active',
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    resourcesStore.set(resource.id, resource);
    return resource;
  }

  async listResources(options: {
    userId: string;
    limit: number;
    cursor?: string;
    status?: string;
  }): Promise<ListResourcesResult> {
    let resources = Array.from(resourcesStore.values()).filter((r) => r.userId === options.userId);

    if (options.status) {
      resources = resources.filter((r) => r.status === options.status);
    }

    // Simple cursor-based pagination
    let startIndex = 0;
    if (options.cursor) {
      const cursorIndex = resources.findIndex((r) => r.id > options.cursor!);
      startIndex = cursorIndex >= 0 ? cursorIndex : resources.length;
    }

    const data = resources.slice(startIndex, startIndex + options.limit);
    const hasMore = startIndex + options.limit < resources.length;

    return {
      data,
      hasMore,
      nextCursor: hasMore ? data[data.length - 1]?.id : undefined,
      prevCursor: options.cursor,
    };
  }

  async getResource(id: string, userId: string): Promise<Resource | null> {
    const resource = resourcesStore.get(id);
    if (!resource || resource.userId !== userId) return null;
    return resource;
  }

  async updateResource(
    id: string,
    userId: string,
    input: UpdateResourceInput
  ): Promise<Resource | null> {
    const resource = resourcesStore.get(id);
    if (!resource || resource.userId !== userId) return null;

    const updated: Resource = {
      ...resource,
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status && { status: input.status }),
      ...(input.metadata && { metadata: { ...resource.metadata, ...input.metadata } }),
      updatedAt: new Date().toISOString(),
    };

    resourcesStore.set(id, updated);
    return updated;
  }

  async deleteResource(id: string, userId: string): Promise<boolean> {
    const resource = resourcesStore.get(id);
    if (!resource || resource.userId !== userId) return false;

    resourcesStore.delete(id);
    return true;
  }
}

/**
 * Error handler for resources
 * @param {Error} error - Error to handle
 */
function handleResourcesError(error) {
  try {
    console.error('[resources]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
