import { Pool, PoolClient } from 'pg';

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
 * Execute a query on the pool
 */
export async function query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }> {
  const pool = createPool();
  try {
    const result = await pool.query(sql, params);
    return result;
  } finally {
    await pool.end();
  }
}

/**
 * Get a single client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = createPool();
  return pool.connect();
}
