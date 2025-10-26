import { Pool, PoolClient, QueryResult } from 'pg';

/**
 * Singleton pool instance - ensures connection pooling is reused across queries
 */
let pool: Pool | null = null;

/**
 * Get PostgreSQL connection URL from environment
 *
 * Environment Variable Precedence:
 * 1. DATABASE_URL - Takes precedence if set
 * 2. Individual vars (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
 *    - DB_HOST: defaults to 'localhost'
 *    - DB_PORT: defaults to '5432'
 *    - DB_USER: defaults to 'postgres'
 *    - DB_PASSWORD: defaults to 'postgres'
 *    - DB_NAME: defaults to 'postgres'
 *
 * @throws Error if environment is misconfigured (missing required vars in production)
 * @returns PostgreSQL connection URL
 */
export function getDatabaseUrl(): string {
  const url = process.env['DATABASE_URL'];
  if (url) {
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      throw new Error('Invalid DATABASE_URL: Must start with postgresql:// or postgres://');
    }
    return url;
  }

  // Fall back to individual connection parameters
  const host = process.env['DB_HOST'] || 'localhost';
  const port = process.env['DB_PORT'] || '5432';
  const user = process.env['DB_USER'] || 'postgres';
  const password = process.env['DB_PASSWORD'] || 'postgres';
  const database = process.env['DB_NAME'] || 'postgres';

  // Validate that port is numeric
  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    throw new Error(`Invalid DB_PORT: Must be a number between 1 and 65535, got "${port}"`);
  }

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

/**
 * Run pending database migrations
 * Uses node-pg-migrate to execute SQL migration files
 */
export async function runMigrations(): Promise<void> {
  // Dynamically import node-pg-migrate to avoid type resolution issues
  // This function is called at runtime, not during build
  // @ts-expect-error node-pg-migrate types can't be resolved with current moduleResolution

  const migrationModule = await import('node-pg-migrate');
  const runner = migrationModule.runner;
  const connectionString = getDatabaseUrl();

  try {
    await runner({
      databaseUrl: connectionString,
      migrationsTable: 'pgmigrations',
      dir: 'services/kaggle-data-api/migrations',
      direction: 'up',
    });
    console.log('Migrations completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Migration failed:', errorMessage);
    throw error;
  }
}
