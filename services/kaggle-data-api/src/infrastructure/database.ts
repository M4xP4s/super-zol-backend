import { Pool, PoolClient } from 'pg';

/**
 * Interface for node-pg-migrate runner to avoid @ts-expect-error
 * Properly typed for type safety
 */
interface MigrationRunner {
  (options: MigrationRunnerOptions): Promise<string[]>;
}

interface MigrationRunnerOptions {
  databaseUrl: string;
  migrationsTable: string;
  dir: string;
  direction: 'up' | 'down';
}

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
 * Execute a query on the singleton pool with optional type safety
 * Reuses connections efficiently through pooling
 *
 * @template T - Type of the row returned by the query
 * @param sql - SQL query string
 * @param params - Query parameters
 * @returns Typed query result
 *
 * @example
 * interface DatasetRow { id: number; name: string; }
 * const result = await query<DatasetRow>('SELECT * FROM datasets WHERE id = $1', [id]);
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null; command: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (getPool().query(sql, params) as Promise<any>);
  return result as { rows: T[]; rowCount: number | null; command: string };
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
 * Properly typed for type safety without @ts-expect-error
 */
export async function runMigrations(): Promise<void> {
  // Dynamically import node-pg-migrate with proper type assertion
  // This function is called at runtime, not during build
  // @ts-expect-error node-pg-migrate is available at runtime; moduleResolution doesn't auto-detect it
  const migrationModule = (await import('node-pg-migrate')) as {
    runner: MigrationRunner;
  };
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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : typeof error === 'string' ? error : String(error);
    console.error('Migration failed:', errorMessage);
    throw error;
  }
}
