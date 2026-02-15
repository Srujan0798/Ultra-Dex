// Copyright (c) 2026 Ultra-Dex
// Connection Pool Service for Postgres and SQLite

import { promisify } from 'util';

class DatabaseConnectionPool {
  constructor(config) {
    this.config = config;
    this.type = config.type; // 'postgres' or 'sqlite'
    this.pool = null;
    this.connection = null;
  }

  async initialize() {
    if (this.type === 'postgres') {
      // Dynamically import pg to avoid requiring it as a hard dependency
      const pgModule = await import('pg');
      const { Pool } = pgModule;
      
      this.pool = new Pool({
        host: this.config.host || 'localhost',
        port: this.config.port || 5432,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        min: this.config.minConnections || 2,
        max: this.config.maxConnections || 10,
        idleTimeoutMillis: this.config.idleTimeout || 30000,
        connectionTimeoutMillis: this.config.connectionTimeout || 2000
      });

      // Test the connection
      try {
        const client = await this.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('PostgreSQL pool initialized successfully');
      } catch (error) {
        console.error('Failed to initialize PostgreSQL pool:', error);
        throw error;
      }
    } else if (this.type === 'sqlite') {
      // Dynamically import sqlite3 to avoid requiring it as a hard dependency
      const sqlite3Module = await import('sqlite3');
      const sqlite3 = sqlite3Module.verbose(); // Enable verbose mode
      
      // For SQLite, we'll use a single connection since it's file-based
      this.connection = new sqlite3.Database(this.config.database || './database.sqlite');
      
      // Promisify the database methods
      this.connection.runAsync = promisify(this.connection.run).bind(this.connection);
      this.connection.getAsync = promisify(this.connection.get).bind(this.connection);
      this.connection.allAsync = promisify(this.connection.all).bind(this.connection);
      
      // Test the connection
      try {
        await this.connection.runAsync('SELECT 1');
        console.log('SQLite connection initialized successfully');
      } catch (error) {
        console.error('Failed to initialize SQLite connection:', error);
        throw error;
      }
    } else {
      throw new Error(`Unsupported database type: ${this.type}`);
    }
  }

  async getConnection() {
    if (this.type === 'postgres') {
      return await this.pool.connect();
    } else if (this.type === 'sqlite') {
      return this.connection;
    }
  }

  async query(sql, params = []) {
    if (this.type === 'postgres') {
      const client = await this.pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows;
      } finally {
        client.release();
      }
    } else if (this.type === 'sqlite') {
      return await this.connection.allAsync(sql, params);
    }
  }

  async execute(sql, params = []) {
    if (this.type === 'postgres') {
      const client = await this.pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rowCount;
      } finally {
        client.release();
      }
    } else if (this.type === 'sqlite') {
      const result = await this.connection.runAsync(sql, params);
      return result.changes;
    }
  }

  async close() {
    if (this.type === 'postgres') {
      await this.pool.end();
    } else if (this.type === 'sqlite') {
      await new Promise((resolve, reject) => {
        this.connection.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  async healthCheck() {
    try {
      if (this.type === 'postgres') {
        const client = await this.pool.connect();
        const result = await client.query('SELECT 1 as alive');
        client.release();
        return { status: 'healthy', details: result.rows[0] };
      } else if (this.type === 'sqlite') {
        const result = await this.connection.getAsync('SELECT 1 as alive');
        return { status: 'healthy', details: result };
      }
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default DatabaseConnectionPool;