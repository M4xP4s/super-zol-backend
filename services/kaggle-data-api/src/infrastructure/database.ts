import { Pool, PoolClient, QueryResult } from 'pg';

/**
 * Singleton pool instance - ensures connection pooling is reused across queries
 */
let pool: Pool | null = null;

/**
 * Get PostgreSQL connection URL from environment
 */
export function getDatabaseUrl(): string {
  const url = process.env['DATABASE_URL'];
  if (url) {
    return url;
  }

  // Fall back to individual connection parameters
  const host = process.env['DB_HOST'] || 'localhost';
  const port = process.env['DB_PORT'] || '5432';
  const user = process.env['DB_USER'] || 'postgres';
  const password = process.env['DB_PASSWORD'] || 'postgres';
  const database = process.env['DB_NAME'] || 'postgres';

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

/**
 * Create and return a PostgreSQL connection pool
 * This is called once and the pool is reused for all queries
 */
export function createPool(): Pool {
  const connectionString = getDatabaseUrl();
  return new Pool({
    connectionString,
    max: parseInt(process.env['DB_POOL_SIZE'] || '10', 10),
    idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000', 10),
  });
}

/**
 * Get the singleton pool instance
 * Creates pool on first use, reuses for all subsequent calls
 */
export function getPool(): Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

/**
 * Execute a query on the singleton pool
 * Reuses connections efficiently through pooling
 */
export async function query(sql: string, params?: unknown[]): Promise<QueryResult> {
  return getPool().query(sql, params);
}

/**
 * Get a single client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

/**
 * Close the pool connection (for cleanup)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
