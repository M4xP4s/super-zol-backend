import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import pg from 'pg';

const { Pool } = pg;

declare module 'fastify' {
  interface FastifyInstance {
    db: pg.Pool;
  }
}

/**
 * Database plugin for PostgreSQL connection pooling
 *
 * Provides a connection pool that is shared across all requests.
 * The pool is automatically closed when the Fastify server shuts down.
 *
 * Environment variables:
 * - DATABASE_URL: PostgreSQL connection string (postgresql://user:pass@host:port/db)
 * - DB_HOST: PostgreSQL host (alternative to DATABASE_URL)
 * - DB_PORT: PostgreSQL port (default: 5432)
 * - DB_USER: PostgreSQL user
 * - DB_PASSWORD: PostgreSQL password
 * - DB_NAME: PostgreSQL database name
 * - DB_MAX_CLIENTS: Maximum number of clients in pool (default: 10)
 * - DB_IDLE_TIMEOUT: Idle timeout in ms (default: 30000)
 */
async function databasePlugin(fastify: FastifyInstance) {
  const databaseUrl = process.env['DATABASE_URL'];

  let pool: pg.Pool;

  if (databaseUrl) {
    // Use connection string
    pool = new Pool({
      connectionString: databaseUrl,
      max: parseInt(process.env['DB_MAX_CLIENTS'] ?? '10', 10),
      idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] ?? '30000', 10),
      connectionTimeoutMillis: parseInt(process.env['DB_CONNECTION_TIMEOUT'] ?? '2000', 10),
    });
  } else {
    // Use individual connection parameters
    pool = new Pool({
      host: process.env['DB_HOST'] ?? 'localhost',
      port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
      user: process.env['DB_USER'] ?? 'superzol',
      password: process.env['DB_PASSWORD'] ?? 'password',
      database: process.env['DB_NAME'] ?? 'superzol',
      max: parseInt(process.env['DB_MAX_CLIENTS'] ?? '10', 10),
      idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] ?? '30000', 10),
      connectionTimeoutMillis: parseInt(process.env['DB_CONNECTION_TIMEOUT'] ?? '2000', 10),
    });
  }

  // Test connection on startup
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    fastify.log.info('Database connection established successfully');
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to connect to database');
    // Don't throw - allow service to start but mark as not ready
    // The readiness probe will fail until DB is available
  }

  // Decorate Fastify instance with pool
  fastify.decorate('db', pool);

  // Close pool on server shutdown
  fastify.addHook('onClose', async (instance) => {
    instance.log.info('Closing database connection pool...');
    await instance.db.end();
  });
}

export default fp(databasePlugin, {
  name: 'database',
  dependencies: [],
});
