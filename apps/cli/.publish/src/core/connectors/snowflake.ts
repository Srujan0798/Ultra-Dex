/**
 * Snowflake Connector for Ultra-Dex
 * Query data warehouse, get schemas, run analytics
 */

import { Connector, ConnectorAuth, ConnectorOperation } from './types.js';

export interface SnowflakeConfig {
  account: string;
  username: string;
  password?: string;
  privateKey?: string;
  database?: string;
  schema?: string;
  warehouse?: string;
  role?: string;
}

export class SnowflakeConnector implements Connector {
  id = 'snowflake';
  name = 'Snowflake';
  description = 'Query Snowflake data warehouse';
  category = 'data' as const;
  status: 'connected' | 'disconnected' | 'error' = 'disconnected';
  auth: ConnectorAuth;
  operations: ConnectorOperation[] = [
    {
      name: 'query',
      description: 'Execute SQL query against Snowflake',
      input: {
        type: 'object',
        properties: {
          sql: { type: 'string' },
        },
        required: ['sql'],
      },
      output: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
    },
    {
      name: 'getSchema',
      description: 'Get database schema information',
      input: {
        type: 'object',
        properties: {
          database: { type: 'string' },
          schemaName: { type: 'string' },
        },
        required: ['database', 'schemaName'],
      },
      output: {
        type: 'object',
        properties: {
          tables: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                columns: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      type: { type: 'string' },
                      nullable: { type: 'boolean' },
                      default: { type: ['string', 'null'] },
                    },
                  },
                },
              },
            },
          },
          views: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
    {
      name: 'getDatabases',
      description: 'Get list of databases',
      input: {
        type: 'object',
        properties: {},
      },
      output: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    {
      name: 'getTables',
      description: 'Get list of tables in a database',
      input: {
        type: 'object',
        properties: {
          database: { type: 'string' },
        },
      },
      output: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    {
      name: 'getSample',
      description: 'Get sample data from a table',
      input: {
        type: 'object',
        properties: {
          tableName: { type: 'string' },
          limit: { type: 'number' },
        },
        required: ['tableName'],
      },
      output: {
        type: 'array',
        items: { type: 'object' },
      },
    },
    {
      name: 'getTableStats',
      description: 'Get table statistics',
      input: {
        type: 'object',
        properties: {
          tableName: { type: 'string' },
        },
        required: ['tableName'],
      },
      output: {
        type: 'object',
        properties: {
          rowCount: { type: 'number' },
          sizeBytes: { type: 'number' },
          columnStats: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                column: { type: 'string' },
                nullCount: { type: 'number' },
                distinctCount: { type: 'number' },
              },
            },
          },
        },
      },
    },
    {
      name: 'profileDataset',
      description: 'Profile a dataset with statistics and samples',
      input: {
        type: 'object',
        properties: {
          tableName: { type: 'string' },
        },
        required: ['tableName'],
      },
      output: {
        type: 'object',
        properties: {
          rowCount: { type: 'number' },
          columns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                nullRate: { type: 'number' },
                uniqueValues: { type: 'number' },
                sampleValues: {
                  type: 'array',
                  items: {},
                },
              },
            },
          },
        },
      },
    },
  ];
  lastError?: string;

  private config: SnowflakeConfig;
  private connection: any = null;

  constructor(config: SnowflakeConfig) {
    this.config = config;
    this.auth = {
      type: 'token',
      token: config.password || config.privateKey,
    };
  }

  async connect(): Promise<void> {
    try {
      // Dynamic import snowflake-sdk
      let snowflake;
      try {
        snowflake = await import('snowflake-sdk');
      } catch (importError) {
        throw new Error('snowflake-sdk not installed. Run: npm install snowflake-sdk');
      }

      this.connection = snowflake.createConnection({
        account: this.config.account,
        username: this.config.username,
        password: this.config.password,
        privateKey: this.config.privateKey,
        database: this.config.database,
        schema: this.config.schema,
        warehouse: this.config.warehouse,
        role: this.config.role,
      });

      await new Promise<void>((resolve, reject) => {
        this.connection.connect((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      this.status = 'connected';
    } catch (error) {
      this.status = 'error';
      if (error instanceof Error) {
        // Handle specific Snowflake connection errors
        if (
          error.message.includes('Failed to connect') ||
          error.message.includes('network') ||
          error.message.includes('ETIMEDOUT')
        ) {
          this.lastError =
            'Failed to connect to Snowflake: Check network connectivity and account details';
        } else if (
          error.message.includes('authentication') ||
          error.message.includes('invalid credentials')
        ) {
          this.lastError = 'Snowflake authentication failed: Invalid credentials';
        } else if (error.message.includes('account') || error.message.includes('Account')) {
          this.lastError =
            'Snowflake account error: Invalid account identifier or account not found';
        } else if (error.message.includes('snowflake-sdk not installed')) {
          // Re-throw the specific error about missing dependency
          throw error;
        } else {
          this.lastError = error.message;
        }
      } else {
        this.lastError = 'Unknown error';
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await new Promise<void>((resolve) => {
        this.connection.destroy(() => resolve());
      });
    }
    this.status = 'disconnected';
  }

  /**
   * Execute SQL query
   */
  async query<T = any>(sql: string): Promise<T[]> {
    this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.connection.execute({
        sqlText: sql,
        complete: (err: any, stmt: any, rows: any[]) => {
          if (err) {
            // Handle specific Snowflake query errors
            if (err.message?.includes('Invalid identifier')) {
              reject(new Error('Snowflake query error: Invalid column or table name'));
            } else if (err.message?.includes('does not exist')) {
              reject(new Error('Snowflake query error: Object does not exist'));
            } else if (err.message?.includes('authorization')) {
              reject(new Error('Snowflake query error: Insufficient privileges'));
            } else {
              reject(err);
            }
          } else {
            resolve(rows);
          }
        },
      });
    });
  }

  /**
   * Get database schema
   */
  async getSchema(
    database: string,
    schemaName: string
  ): Promise<{
    tables: Array<{
      name: string;
      columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
        default?: string;
      }>;
    }>;
    views: string[];
  }> {
    this.ensureConnected();

    // Get tables
    let tablesResult: { TABLE_NAME: string }[] = [];
    try {
      tablesResult = await this.query<{ TABLE_NAME: string }>(`
        SELECT TABLE_NAME 
        FROM ${database}.INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = '${schemaName}'
      `);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message?.includes('does not exist')) {
          throw new Error(
            `Snowflake schema error: Schema '${schemaName}' does not exist in database '${database}'`
          );
        } else if (error.message?.includes('Invalid identifier')) {
          throw new Error('Snowflake schema error: Invalid database or schema identifier');
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    const tables = [];
    for (const table of tablesResult) {
      let columns: {
        COLUMN_NAME: string;
        DATA_TYPE: string;
        IS_NULLABLE: string;
        COLUMN_DEFAULT: string | null;
      }[] = [];
      try {
        columns = await this.query<{
          COLUMN_NAME: string;
          DATA_TYPE: string;
          IS_NULLABLE: string;
          COLUMN_DEFAULT: string | null;
        }>(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
          FROM ${database}.INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = '${schemaName}' AND TABLE_NAME = '${table.TABLE_NAME}'
        `);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message?.includes('does not exist')) {
            throw new Error(`Snowflake table error: Table '${table.TABLE_NAME}' does not exist`);
          } else if (error.message?.includes('Invalid identifier')) {
            throw new Error('Snowflake table error: Invalid table identifier');
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }

      tables.push({
        name: table.TABLE_NAME,
        columns: columns.map((c) => ({
          name: c.COLUMN_NAME,
          type: c.DATA_TYPE,
          nullable: c.IS_NULLABLE === 'YES',
          default: c.COLUMN_DEFAULT || undefined,
        })),
      });
    }

    // Get views
    let viewsResult: { TABLE_NAME: string }[] = [];
    try {
      viewsResult = await this.query<{ TABLE_NAME: string }>(`
        SELECT TABLE_NAME 
        FROM ${database}.INFORMATION_SCHEMA.VIEWS 
        WHERE TABLE_SCHEMA = '${schemaName}'
      `);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message?.includes('does not exist')) {
          throw new Error(`Snowflake schema error: No views found in schema '${schemaName}'`);
        } else if (error.message?.includes('Invalid identifier')) {
          throw new Error('Snowflake schema error: Invalid database or schema identifier');
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    return {
      tables,
      views: viewsResult.map((v) => v.TABLE_NAME),
    };
  }

  /**
   * Get list of databases
   */
  async getDatabases(): Promise<string[]> {
    this.ensureConnected();

    const result = await this.query<{ name: string }>('SHOW DATABASES');
    return result.map((r) => r.name);
  }

  /**
   * Get list of tables
   */
  async getTables(database?: string): Promise<string[]> {
    this.ensureConnected();

    const db = database || this.config.database;
    if (!db) {
      throw new Error('No database specified');
    }

    const result = await this.query<{ name: string }>(`SHOW TABLES IN DATABASE ${db}`);
    return result.map((r) => r.name);
  }

  /**
   * Get sample data from a table
   */
  async getSample(tableName: string, limit: number = 100): Promise<any[]> {
    this.ensureConnected();

    return await this.query(`SELECT * FROM ${tableName} LIMIT ${limit}`);
  }

  /**
   * Get table statistics
   */
  async getTableStats(tableName: string): Promise<{
    rowCount: number;
    sizeBytes: number;
    columnStats: Array<{
      column: string;
      nullCount: number;
      distinctCount: number;
    }>;
  }> {
    this.ensureConnected();

    const result = await this.query<{
      ROW_COUNT: number;
      BYTES: number;
    }>(`
      SELECT ROW_COUNT, BYTES
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = '${tableName}'
    `);

    const stats = result[0];

    return {
      rowCount: stats?.ROW_COUNT || 0,
      sizeBytes: stats?.BYTES || 0,
      columnStats: [], // Would need separate queries per column
    };
  }

  /**
   * Profile a dataset
   */
  async profileDataset(tableName: string): Promise<{
    rowCount: number;
    columns: Array<{
      name: string;
      type: string;
      nullRate: number;
      uniqueValues: number;
      sampleValues: any[];
    }>;
  }> {
    this.ensureConnected();

    // Get sample
    const sample = await this.getSample(tableName, 1000);

    // Get column info
    const columns = await this.query<{
      COLUMN_NAME: string;
      DATA_TYPE: string;
    }>(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${tableName}'
    `);

    const profile = {
      rowCount: sample.length,
      columns: columns.map((col) => {
        const values = sample.map((row) => row[col.COLUMN_NAME]);
        const nullCount = values.filter((v) => v === null).length;
        const uniqueValues = new Set(values).size;

        return {
          name: col.COLUMN_NAME,
          type: col.DATA_TYPE,
          nullRate: nullCount / values.length,
          uniqueValues,
          sampleValues: values.slice(0, 5),
        };
      }),
    };

    return profile;
  }

  private ensureConnected(): void {
    if (this.status !== 'connected') {
      throw new Error('Snowflake not connected. Call connect() first.');
    }
  }
}

export default SnowflakeConnector;
