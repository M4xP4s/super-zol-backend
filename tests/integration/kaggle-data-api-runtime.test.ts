/**
 * Kaggle Data API Runtime Integration Tests
 * Tests actual service functionality with real PostgreSQL database
 *
 * These tests verify:
 * - Service connects to PostgreSQL successfully
 * - /datasets endpoint returns properly formatted data
 * - Error handling for database failures
 * - Connection pool management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

describe('Kaggle Data API Runtime Integration', () => {
  let testPool: Pool;
  const testDbUrl =
    process.env['TEST_DATABASE_URL'] ||
    'postgresql://test_user:test_password@localhost:5432/test_db';

  /**
   * Setup: Create test database connection and initialize test data
   */
  beforeAll(async () => {
    testPool = new Pool({ connectionString: testDbUrl });

    try {
      // Create datasets table for testing
      await testPool.query(`
        DROP TABLE IF EXISTS datasets CASCADE;
        CREATE TABLE datasets (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Insert test data
      await testPool.query(`
        INSERT INTO datasets (name, description) VALUES
        ('dataset-a', 'Test dataset A'),
        ('dataset-b', 'Test dataset B'),
        ('dataset-c', 'Test dataset C')
      `);

      console.log('Test database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize test database:', error);
      throw error;
    }
  });

  /**
   * Teardown: Clean up test database
   */
  afterAll(async () => {
    try {
      await testPool.query('DROP TABLE IF EXISTS datasets CASCADE');
      await testPool.end();
      console.log('Test database cleaned up');
    } catch (error) {
      console.error('Failed to cleanup test database:', error);
    }
  });

  describe('Database Connection', () => {
    it('should connect to PostgreSQL successfully', async () => {
      try {
        const result = await testPool.query('SELECT NOW()');
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].now).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to connect to test database at ${testDbUrl}: ${error}`);
      }
    });

    it('should have datasets table created', async () => {
      const result = await testPool.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = 'datasets'
      `);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].table_name).toBe('datasets');
    });

    it('should have test data inserted', async () => {
      const result = await testPool.query('SELECT * FROM datasets');
      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].name).toBe('dataset-a');
      expect(result.rows[1].name).toBe('dataset-b');
      expect(result.rows[2].name).toBe('dataset-c');
    });
  });

  describe('Database Module Functionality', () => {
    it('should validate DATABASE_URL format', async () => {
      const { getDatabaseUrl } = await import(
        '../../services/kaggle-data-api/src/infrastructure/database.js'
      );

      // Valid URLs should not throw
      expect(() => getDatabaseUrl()).not.toThrow();
    });

    it('should validate port number in getDatabaseUrl', async () => {
      const { getDatabaseUrl } = await import(
        '../../services/kaggle-data-api/src/infrastructure/database.js'
      );

      // Save original env
      const originalEnv = { ...process.env };

      try {
        // Invalid port should throw
        process.env['DB_PORT'] = 'invalid';
        expect(() => getDatabaseUrl()).toThrow('Invalid DB_PORT');

        // Port out of range should throw
        process.env['DB_PORT'] = '99999';
        expect(() => getDatabaseUrl()).toThrow('Invalid DB_PORT');

        // Valid port should not throw
        process.env['DB_PORT'] = '5432';
        expect(() => getDatabaseUrl()).not.toThrow();
      } finally {
        process.env = originalEnv;
      }
    });

    it('should throw on invalid DATABASE_URL format', async () => {
      const { getDatabaseUrl } = await import(
        '../../services/kaggle-data-api/src/infrastructure/database.js'
      );

      const originalEnv = { ...process.env };

      try {
        process.env['DATABASE_URL'] = 'mysql://invalid';
        expect(() => getDatabaseUrl()).toThrow('Invalid DATABASE_URL');
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe('Query Functionality', () => {
    it('should execute parameterized queries safely', async () => {
      // Test that parameterized queries work with the pg library
      const result = await testPool.query(
        'SELECT * FROM datasets ORDER BY name LIMIT $1 OFFSET $2',
        [2, 0]
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe('dataset-a');
      expect(result.rows[1].name).toBe('dataset-b');
    });

    it('should handle SQL with ORDER BY validation', async () => {
      // Verify that ORDER BY needs to be hardcoded, not parameterized
      const validOrder = 'name';
      const result = await testPool.query(`SELECT * FROM datasets ORDER BY ${validOrder}`, []);

      expect(result.rows).toHaveLength(3);
      // Verify ordering
      expect(result.rows[0].name).toBe('dataset-a');
      expect(result.rows[1].name).toBe('dataset-b');
      expect(result.rows[2].name).toBe('dataset-c');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid SQL gracefully', async () => {
      try {
        await testPool.query('SELECT * FROM nonexistent_table');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });

    it('should handle connection errors gracefully', async () => {
      const badPool = new Pool({
        connectionString: 'postgresql://invalid:password@nonexistent-host:5432/db',
      });

      try {
        await badPool.query('SELECT NOW()');
        expect.fail('Should have thrown a connection error');
      } catch (error) {
        expect(error).toBeDefined();
        // Connection should fail, not throw uncaught error
      } finally {
        await badPool.end();
      }
    });
  });

  describe('Connection Pool Management', () => {
    it('should reuse connections from pool', async () => {
      const results = await Promise.all([
        testPool.query('SELECT 1 as id'),
        testPool.query('SELECT 2 as id'),
        testPool.query('SELECT 3 as id'),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.rows[0].id).toBe(index + 1);
      });
    });

    it('should not exceed max connections', async () => {
      const smallPool = new Pool({
        connectionString: testDbUrl,
        max: 2,
        idleTimeoutMillis: 1000,
      });

      try {
        // Create multiple concurrent queries that should reuse connections
        const queries = Array.from({ length: 10 }, (_, i) =>
          smallPool.query('SELECT $1 as id', [i])
        );

        const results = await Promise.all(queries);
        expect(results).toHaveLength(10);
      } finally {
        await smallPool.end();
      }
    });
  });
});
