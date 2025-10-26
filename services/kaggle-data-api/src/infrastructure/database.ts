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
 * Encode credentials for use in PostgreSQL connection URL
 * Handles special characters in passwords and usernames
 */
function encodeCredential(value: string): string {
  return encodeURIComponent(value);
}

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
 * Note: This function re-resolves environment variables on each call to allow
 * for mid-run environment changes (important for testing and dynamic configs)
 *
 * @throws Error if environment is misconfigured
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

  // Validate pool size if provided
  if (process.env['DB_POOL_SIZE']) {
    const poolSize = parseInt(process.env['DB_POOL_SIZE'], 10);
    if (isNaN(poolSize) || poolSize < 1 || poolSize > 100) {
      throw new Error(
        `Invalid DB_POOL_SIZE: Must be a number between 1 and 100, got "${process.env['DB_POOL_SIZE']}"`
      );
    }
  }

  // Validate idle timeout if provided
  if (process.env['DB_IDLE_TIMEOUT']) {
    const idleTimeout = parseInt(process.env['DB_IDLE_TIMEOUT'], 10);
    if (isNaN(idleTimeout) || idleTimeout < 0) {
      throw new Error(
        `Invalid DB_IDLE_TIMEOUT: Must be a non-negative number, got "${process.env['DB_IDLE_TIMEOUT']}"`
      );
    }
  }

  const encodedPassword = encodeCredential(password);
  const encodedUser = encodeCredential(user);
  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`;
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
 * Guards against reusing a closed pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = createPool();
  }
  // Guard against reusing a closed pool by checking its state
  if (pool.ended) {
    pool = createPool();
  }
  return pool;
}

/**
 * Query result type for proper type safety
 * Matches the pg library's QueryResult interface
 */
export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number | null;
  command: string;
}

/**
 * Execute a query on the singleton pool with optional type safety
 * Reuses connections efficiently through pooling
 *
 * @template T - Type of the row returned by the query
 * @param sql - SQL query string
 * @param params - Query parameters (readonly array for safety)
 * @returns Typed query result
 *
 * @example
 * interface DatasetRow { id: number; name: string; }
 * const result = await query<DatasetRow>('SELECT * FROM datasets WHERE id = $1', [id] as const);
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: ReadonlyArray<unknown>
): Promise<QueryResult<T>> {
  // Convert readonly array to mutable array for pg library compatibility
  const mutableParams = params ? Array.from(params) : undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await getPool().query<any>(sql, mutableParams);
  return {
    rows: result.rows as T[],
    rowCount: result.rowCount,
    command: result.command,
  };
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
 * Dynamically load the migration runner from node-pg-migrate
 * This is typed cleanly without @ts-expect-error by using a module adapter
 */
async function loadMigrationRunner(): Promise<MigrationRunner> {
  // node-pg-migrate is available at runtime, just not in the module resolution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const module = await import('node-pg-migrate' as any);
  return module.runner as MigrationRunner;
}

/**
 * Run pending database migrations
 * Uses node-pg-migrate to execute SQL migration files
 * Validates migration directory and preserves stack traces for debugging
 */
export async function runMigrations(): Promise<void> {
  const connectionString = getDatabaseUrl();
  const migrationsDir = 'services/kaggle-data-api/migrations';

  try {
    // Validate migrations directory path (non-empty, not containing suspicious patterns)
    if (!migrationsDir || migrationsDir.includes('..')) {
      throw new Error(`Invalid migrations directory: "${migrationsDir}"`);
    }

    const runner = await loadMigrationRunner();

    await runner({
      databaseUrl: connectionString,
      migrationsTable: 'pgmigrations',
      dir: migrationsDir,
      direction: 'up',
    });
    console.log('Migrations completed successfully');
  } catch (error: unknown) {
    // Preserve stack trace for better debugging
    if (error instanceof Error) {
      console.error('Migration failed:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
    // For non-Error types, include context
    console.error('Migration failed with unknown error type:', error);
    throw new Error(`Migration failed: ${String(error)}`);
  }
}
