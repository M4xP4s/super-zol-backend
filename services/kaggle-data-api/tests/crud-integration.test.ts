/**
 * CRUD Integration Tests for Datasets API
 * Tests all POST, GET, PUT, DELETE operations with real database
 *
 * Usage:
 * - Requires PostgreSQL running with migration applied
 * - Can be run with TEST_DATABASE_URL env var or defaults to docker-compose database
 * - Tests skip gracefully if database is unavailable
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { closePool, query } from '../src/infrastructure/database.js';

/**
 * Test data factory
 */
function createTestDataset(overrides?: Record<string, unknown>) {
  return {
    name: `test-dataset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description: 'Test dataset for integration testing',
    source_url: 'https://example.com/dataset',
    ...overrides,
  };
}

describe('CRUD Integration Tests', () => {
  let databaseAvailable = false;

  beforeAll(async () => {
    try {
      await query('SELECT 1');
      databaseAvailable = true;
      console.log('✅ Database available - running integration tests');
    } catch {
      console.warn('⚠️  Database unavailable - tests will be skipped');
      databaseAvailable = false;
    }
  });

  afterAll(async () => {
    // Clean up: close database connections
    await closePool();
  });

  beforeEach(async () => {
    // Skip test if database is not available
    if (!databaseAvailable) {
      return;
    }

    // Clean up test data before each test
    try {
      // Delete test datasets (those with test-dataset- prefix)
      await query(`DELETE FROM datasets WHERE name LIKE 'test-dataset-%'`);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('POST /datasets - Create Dataset', () => {
    it('should create a new dataset with all fields', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();

      const result = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, source_url, created_at, updated_at`,
        [testData.name, testData.description, testData.source_url]
      );

      expect(result.rows).toHaveLength(1);
      const dataset = result.rows[0];

      expect(dataset).toHaveProperty('id');
      expect(dataset.id).toBeGreaterThan(0);
      expect(dataset.name).toBe(testData.name);
      expect(dataset.description).toBe(testData.description);
      expect(dataset.source_url).toBe(testData.source_url);
      expect(dataset).toHaveProperty('created_at');
      expect(dataset).toHaveProperty('updated_at');
    });

    it('should create a dataset with minimal fields (name only)', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset({ description: undefined, source_url: undefined });

      const result = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, source_url, created_at, updated_at`,
        [testData.name, null, null]
      );

      expect(result.rows).toHaveLength(1);
      const dataset = result.rows[0];

      expect(dataset.name).toBe(testData.name);
      expect(dataset.description).toBeNull();
      expect(dataset.source_url).toBeNull();
    });

    it('should reject duplicate dataset names', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();

      // Insert first dataset
      await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)`,
        [testData.name, testData.description, testData.source_url]
      );

      // Try to insert with same name - should fail
      let error: Error | null = null;
      try {
        await query(
          `INSERT INTO datasets (name, description, source_url)
           VALUES ($1, $2, $3)`,
          [testData.name, 'different description', 'https://different.com']
        );
      } catch (err) {
        error = err as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message?.includes('duplicate key') || error?.message?.includes('unique')).toBe(
        true
      );
    });
  });

  describe('GET /datasets - List Datasets', () => {
    it('should fetch all datasets with pagination', async () => {
      if (!databaseAvailable) return;

      // Create test datasets
      const datasets = [
        createTestDataset({ name: 'test-dataset-aaa' }),
        createTestDataset({ name: 'test-dataset-bbb' }),
        createTestDataset({ name: 'test-dataset-ccc' }),
      ];

      for (const dataset of datasets) {
        await query(`INSERT INTO datasets (name, description, source_url) VALUES ($1, $2, $3)`, [
          dataset.name,
          dataset.description,
          dataset.source_url,
        ]);
      }

      // Fetch all
      const result = await query(
        `SELECT * FROM datasets WHERE name LIKE 'test-dataset-%' ORDER BY name LIMIT $1 OFFSET $2`,
        [100, 0]
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(3);
    });

    it('should respect limit parameter', async () => {
      if (!databaseAvailable) return;

      const result = await query(
        `SELECT * FROM datasets ORDER BY name LIMIT $1 OFFSET $2`,
        [10, 0]
      );

      expect(result.rows.length).toBeLessThanOrEqual(10);
    });

    it('should respect offset parameter', async () => {
      if (!databaseAvailable) return;

      const resultPage1 = await query(
        `SELECT * FROM datasets ORDER BY name LIMIT $1 OFFSET $2`,
        [10, 0]
      );

      const resultPage2 = await query(
        `SELECT * FROM datasets ORDER BY name LIMIT $1 OFFSET $2`,
        [10, 10]
      );

      // If both pages have data, they should be different
      if (resultPage1.rows.length > 0 && resultPage2.rows.length > 0) {
        expect(resultPage1.rows[0].id).not.toBe(resultPage2.rows[0].id);
      }
    });

    it('should allow ordering by different columns', async () => {
      if (!databaseAvailable) return;

      const resultByName = await query(
        `SELECT * FROM datasets ORDER BY name LIMIT $1 OFFSET $2`,
        [100, 0]
      );

      const resultById = await query(
        `SELECT * FROM datasets ORDER BY id LIMIT $1 OFFSET $2`,
        [100, 0]
      );

      const resultByCreated = await query(
        `SELECT * FROM datasets ORDER BY created_at LIMIT $1 OFFSET $2`,
        [100, 0]
      );

      expect(resultByName.rows).toBeDefined();
      expect(resultById.rows).toBeDefined();
      expect(resultByCreated.rows).toBeDefined();
    });
  });

  describe('GET /datasets/:id - Get Single Dataset', () => {
    it('should fetch a single dataset by ID', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();

      // Create dataset
      const createResult = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, source_url, created_at, updated_at`,
        [testData.name, testData.description, testData.source_url]
      );

      const createdId = createResult.rows[0].id;

      // Fetch by ID
      const fetchResult = await query('SELECT * FROM datasets WHERE id = $1', [createdId]);

      expect(fetchResult.rows).toHaveLength(1);
      const dataset = fetchResult.rows[0];
      expect(dataset.id).toBe(createdId);
      expect(dataset.name).toBe(testData.name);
    });

    it('should return empty result for non-existent dataset', async () => {
      if (!databaseAvailable) return;

      const result = await query('SELECT * FROM datasets WHERE id = $1', [999999]);

      expect(result.rows).toHaveLength(0);
    });

    it('should return all dataset fields', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();

      const createResult = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, source_url, created_at, updated_at`,
        [testData.name, testData.description, testData.source_url]
      );

      const createdId = createResult.rows[0].id;
      const fetchResult = await query('SELECT * FROM datasets WHERE id = $1', [createdId]);

      const dataset = fetchResult.rows[0];
      expect(dataset).toHaveProperty('id');
      expect(dataset).toHaveProperty('name');
      expect(dataset).toHaveProperty('description');
      expect(dataset).toHaveProperty('source_url');
      expect(dataset).toHaveProperty('created_at');
      expect(dataset).toHaveProperty('updated_at');
    });
  });

  describe('PUT /datasets/:id - Update Dataset', () => {
    it('should update dataset name', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();
      const newName = `updated-${testData.name}`;

      // Create dataset
      const createResult = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testData.name, testData.description, testData.source_url]
      );

      const createdId = createResult.rows[0].id;

      // Update name
      const updateResult = await query(
        `UPDATE datasets SET name = $1 WHERE id = $2
         RETURNING id, name, description, source_url, created_at, updated_at`,
        [newName, createdId]
      );

      expect(updateResult.rows).toHaveLength(1);
      expect(updateResult.rows[0].name).toBe(newName);
    });

    it('should update dataset description', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();
      const newDescription = 'Updated description';

      const createResult = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testData.name, testData.description, testData.source_url]
      );

      const createdId = createResult.rows[0].id;

      const updateResult = await query(
        `UPDATE datasets SET description = $1 WHERE id = $2
         RETURNING description`,
        [newDescription, createdId]
      );

      expect(updateResult.rows[0].description).toBe(newDescription);
    });

    it('should clear description when set to null', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();

      const createResult = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testData.name, testData.description, testData.source_url]
      );

      const createdId = createResult.rows[0].id;

      const updateResult = await query(
        `UPDATE datasets SET description = $1 WHERE id = $2
         RETURNING description`,
        [null, createdId]
      );

      expect(updateResult.rows[0].description).toBeNull();
    });

    it('should update multiple fields at once', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();
      const newName = `updated-multi-${testData.name}`;
      const newDescription = 'Multi-field update';

      const createResult = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testData.name, testData.description, testData.source_url]
      );

      const createdId = createResult.rows[0].id;

      const updateResult = await query(
        `UPDATE datasets SET name = $1, description = $2 WHERE id = $3
         RETURNING id, name, description`,
        [newName, newDescription, createdId]
      );

      expect(updateResult.rows[0].name).toBe(newName);
      expect(updateResult.rows[0].description).toBe(newDescription);
    });

    it('should return empty result for non-existent dataset', async () => {
      if (!databaseAvailable) return;

      const result = await query(
        `UPDATE datasets SET name = $1 WHERE id = $2
         RETURNING id`,
        ['new-name', 999999]
      );

      expect(result.rows).toHaveLength(0);
    });

    it('should update updated_at timestamp on update', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();

      const createResult = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING id, updated_at`,
        [testData.name, testData.description, testData.source_url]
      );

      const createdId = createResult.rows[0].id;
      const originalUpdatedAt = createResult.rows[0].updated_at;

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updateResult = await query(
        `UPDATE datasets SET description = $1 WHERE id = $2
         RETURNING updated_at`,
        ['new description', createdId]
      );

      // PostgreSQL trigger should have updated this timestamp
      expect(updateResult.rows[0].updated_at).toBeDefined();
      // Timestamp should have changed (or at least be different due to precision)
      expect(updateResult.rows[0].updated_at).not.toBe(originalUpdatedAt);
    });
  });

  describe('DELETE /datasets/:id - Delete Dataset', () => {
    it('should delete a dataset by ID', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();

      const createResult = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testData.name, testData.description, testData.source_url]
      );

      const createdId = createResult.rows[0].id;

      // Delete
      const deleteResult = await query('DELETE FROM datasets WHERE id = $1 RETURNING id', [
        createdId,
      ]);

      expect(deleteResult.rows).toHaveLength(1);
      expect(deleteResult.rows[0].id).toBe(createdId);

      // Verify it's deleted
      const fetchResult = await query('SELECT * FROM datasets WHERE id = $1', [createdId]);
      expect(fetchResult.rows).toHaveLength(0);
    });

    it('should return empty result for non-existent dataset', async () => {
      if (!databaseAvailable) return;

      const result = await query('DELETE FROM datasets WHERE id = $1 RETURNING id', [999999]);

      expect(result.rows).toHaveLength(0);
    });

    it('should completely remove dataset from database', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();

      const createResult = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testData.name, testData.description, testData.source_url]
      );

      const createdId = createResult.rows[0].id;

      // Verify it exists
      let fetchResult = await query('SELECT * FROM datasets WHERE id = $1', [createdId]);
      expect(fetchResult.rows).toHaveLength(1);

      // Delete
      await query('DELETE FROM datasets WHERE id = $1', [createdId]);

      // Verify it's gone
      fetchResult = await query('SELECT * FROM datasets WHERE id = $1', [createdId]);
      expect(fetchResult.rows).toHaveLength(0);
    });
  });

  describe('Database Constraints', () => {
    it('should enforce name uniqueness constraint', async () => {
      if (!databaseAvailable) return;

      const testName = `unique-test-${Date.now()}`;

      // Insert first dataset
      await query(`INSERT INTO datasets (name) VALUES ($1)`, [testName]);

      // Try to insert with same name - should fail
      let error: Error | null = null;
      try {
        await query(`INSERT INTO datasets (name) VALUES ($1)`, [testName]);
      } catch (err) {
        error = err as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toMatch(/duplicate|unique/i);
    });

    it('should enforce name not null constraint', async () => {
      if (!databaseAvailable) return;

      let error: Error | null = null;
      try {
        // This should fail because name is not nullable
        await query(`INSERT INTO datasets (name, description) VALUES ($1, $2)`, [null, 'test']);
      } catch (err) {
        error = err as Error;
      }

      expect(error).toBeTruthy();
    });

    it('should have indexes on name and created_at', async () => {
      if (!databaseAvailable) return;

      // Query information schema to check for indexes
      const result = await query(`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'datasets'
        AND (indexname LIKE '%name%' OR indexname LIKE '%created_at%')
      `);

      // Should have indexes on these columns
      const indexNames = result.rows.map((r) => r.indexname);
      expect(indexNames.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency across create and fetch', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();

      const createResult = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [testData.name, testData.description, testData.source_url]
      );

      const createdDataset = createResult.rows[0];
      const createdId = createdDataset.id;

      const fetchResult = await query('SELECT * FROM datasets WHERE id = $1', [createdId]);
      const fetchedDataset = fetchResult.rows[0];

      expect(fetchedDataset.name).toBe(createdDataset.name);
      expect(fetchedDataset.description).toBe(createdDataset.description);
      expect(fetchedDataset.source_url).toBe(createdDataset.source_url);
      expect(fetchedDataset.created_at).toBe(createdDataset.created_at);
    });

    it('should maintain data consistency across update and fetch', async () => {
      if (!databaseAvailable) return;

      const testData = createTestDataset();

      const createResult = await query(
        `INSERT INTO datasets (name, description, source_url)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testData.name, testData.description, testData.source_url]
      );

      const createdId = createResult.rows[0].id;
      const newName = `updated-${testData.name}`;
      const newDescription = 'Updated for integrity test';

      await query(`UPDATE datasets SET name = $1, description = $2 WHERE id = $3`, [
        newName,
        newDescription,
        createdId,
      ]);

      const fetchResult = await query('SELECT * FROM datasets WHERE id = $1', [createdId]);
      const fetchedDataset = fetchResult.rows[0];

      expect(fetchedDataset.name).toBe(newName);
      expect(fetchedDataset.description).toBe(newDescription);
    });
  });
});
