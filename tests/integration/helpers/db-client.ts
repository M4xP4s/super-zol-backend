/**
 * Database Client Helper for Integration Tests
 * Provides utilities for connecting to PostgreSQL running in K8s or CI
 */

import pg from 'pg';

export interface DbClientConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export class DbClient {
  private pool: pg.Pool;

  constructor(config: DbClientConfig) {
    this.pool = new pg.Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  async query<T = unknown>(text: string, params?: unknown[]): Promise<pg.QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      return await client.query<T>(text, params);
    } finally {
      client.release();
    }
  }

  async queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result.rows[0] ?? null;
  }

  async queryAll<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
    const result = await this.query<T>(text, params);
    return result.rows;
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
