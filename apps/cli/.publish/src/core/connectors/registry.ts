/**
 * Connector Registry for Ultra-Dex
 * Manages connectors and provides a unified interface for skills
 */

import { Connector, ConnectorRegistry, ConnectorAuth } from './types.js';

export class UltraDexConnectorRegistry implements ConnectorRegistry {
  private connectors: Map<string, Connector> = new Map();

  /**
   * Register a connector
   */
  register(connector: Connector): void {
    this.connectors.set(connector.id, connector);
  }

  /**
   * Get a connector by ID
   */
  get(id: string): Connector | undefined {
    return this.connectors.get(id);
  }

  /**
   * Check if a connector exists
   */
  has(id: string): boolean {
    return this.connectors.has(id);
  }

  /**
   * List all connectors
   */
  list(): Connector[] {
    return Array.from(this.connectors.values());
  }

  /**
   * List connectors by category
   */
  listByCategory(category: string): Connector[] {
    return this.list().filter((connector) => connector.category === category);
  }

  /**
   * Get connected connectors
   */
  getConnected(): Connector[] {
    return this.list().filter((connector) => connector.status === 'connected');
  }

  /**
   * Disconnect a connector
   */
  async disconnect(id: string): Promise<void> {
    const connector = this.get(id);
    if (connector && connector.status === 'connected') {
      await connector.disconnect();
    }
  }

  /**
   * Connect a connector with authentication
   */
  async connect(id: string, auth: ConnectorAuth): Promise<void> {
    const connector = this.get(id);
    if (!connector) {
      throw new Error(`Connector not found: ${id}`);
    }

    // Update connector auth
    connector.auth = auth;

    // Try to connect
    await connector.connect();
  }

  /**
   * Remove a connector
   */
  remove(id: string): boolean {
    return this.connectors.delete(id);
  }

  /**
   * Get connector status
   */
  getStatus(): {
    total: number;
    connected: number;
    disconnected: number;
    error: number;
    connectors: Array<{
      id: string;
      name: string;
      status: string;
      lastError?: string;
    }>;
  } {
    const connectors = this.list();
    return {
      total: connectors.length,
      connected: connectors.filter((c) => c.status === 'connected').length,
      disconnected: connectors.filter((c) => c.status === 'disconnected').length,
      error: connectors.filter((c) => c.status === 'error').length,
      connectors: connectors.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        lastError: c.lastError,
      })),
    };
  }
}

// Export singleton instance
export const connectorRegistry = new UltraDexConnectorRegistry();

export default UltraDexConnectorRegistry;
