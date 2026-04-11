// Copyright (c) 2026 Ultra-Dex

/**
 * Neo4j Connector for Graph RAG
 * Manages connection and operations with Neo4j database
 */

import chalk from 'chalk';

/**
 * Neo4j Connector
 */
export class Neo4jConnector {
  constructor(options = {}) {
    this.uri = options.uri || process.env.NEO4J_URI || 'bolt://localhost:7687';
    this.user = options.user || process.env.NEO4J_USER || 'neo4j';
    this.password = options.password || process.env.NEO4J_PASSWORD || 'password';
    this.driver = null;
    this.connected = false;
  }

  /**
   * Connect to Neo4j
   */
  async connect() {
    try {
      const neo4j = await import('neo4j-driver');
      this.driver = neo4j.default.driver(
        this.uri,
        neo4j.default.auth.basic(this.user, this.password)
      );

      // Test connection
      const session = this.driver.session();
      await session.run('RETURN 1');
      await session.close();

      this.connected = true;
      console.log(chalk.green('[Neo4j] Connected successfully'));
      return true;
    } catch (error) {
      console.log(chalk.red('[Neo4j] Connection failed:', error.message));
      this.connected = false;
      return false;
    }
  }

  /**
   * Run a Cypher query
   */
  async query(cypher, params = {}) {
    if (!this.connected || !this.driver) {
      throw new Error('Not connected to Neo4j');
    }

    const session = this.driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records.map((record) => {
        const obj = {};
        record.keys.forEach((key) => {
          obj[key] = record.get(key);
        });
        return obj;
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Create constraints
   */
  async createConstraints() {
    const constraints = [
      'CREATE CONSTRAINT file_path IF NOT EXISTS FOR (f:File) REQUIRE f.path IS UNIQUE',
      'CREATE CONSTRAINT function_id IF NOT EXISTS FOR (fn:Function) REQUIRE fn.id IS UNIQUE',
      'CREATE CONSTRAINT class_id IF NOT EXISTS FOR (c:Class) REQUIRE c.id IS UNIQUE',
    ];

    for (const constraint of constraints) {
      try {
        await this.query(constraint);
      } catch (error) {
        console.log(chalk.yellow(`[Neo4j] Constraint warning: ${error.message}`));
      }
    }
  }

  /**
   * Create indexes
   */
  async createIndexes() {
    const indexes = [
      'CREATE INDEX file_type IF NOT EXISTS FOR (f:File) ON (f.type)',
      'CREATE INDEX function_name IF NOT EXISTS FOR (fn:Function) ON (fn.name)',
      'CREATE INDEX class_name IF NOT EXISTS FOR (c:Class) ON (c.name)',
    ];

    for (const index of indexes) {
      try {
        await this.query(index);
      } catch (error) {
        console.log(chalk.yellow(`[Neo4j] Index warning: ${error.message}`));
      }
    }
  }

  /**
   * Initialize schema
   */
  async initializeSchema() {
    await this.createConstraints();
    await this.createIndexes();
    console.log(chalk.green('[Neo4j] Schema initialized'));
  }

  /**
   * Get database stats
   */
  async getStats() {
    try {
      const fileCount = await this.query('MATCH (f:File) RETURN count(f) as count');
      const functionCount = await this.query('MATCH (fn:Function) RETURN count(fn) as count');
      const classCount = await this.query('MATCH (c:Class) RETURN count(c) as count');
      const relationshipCount = await this.query('MATCH ()-[r]->() RETURN count(r) as count');

      return {
        files: fileCount[0]?.count?.toNumber() || 0,
        functions: functionCount[0]?.count?.toNumber() || 0,
        classes: classCount[0]?.count?.toNumber() || 0,
        relationships: relationshipCount[0]?.count?.toNumber() || 0,
      };
    } catch (error) {
      console.log(chalk.yellow('[Neo4j] Stats error:', error.message));
      return { files: 0, functions: 0, classes: 0, relationships: 0 };
    }
  }

  /**
   * Clear all data
   */
  async clearAll() {
    try {
      await this.query('MATCH (n) DETACH DELETE n');
      console.log(chalk.yellow('[Neo4j] All data cleared'));
    } catch (error) {
      console.log(chalk.red('[Neo4j] Clear error:', error.message));
    }
  }

  /**
   * Close connection
   */
  async close() {
    if (this.driver) {
      await this.driver.close();
      this.connected = false;
      console.log(chalk.gray('[Neo4j] Connection closed'));
    }
  }
}

// Export singleton
export const neo4jConnector = new Neo4jConnector();
