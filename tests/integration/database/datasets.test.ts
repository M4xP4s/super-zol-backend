/**
 * Database Dataset Operations Integration Tests
 * Tests dataset table operations and queries
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DbClient } from '../helpers/db-client.js';
import { getTestConfig } from '../helpers/test-config.js';

interface Dataset {
  id: number;
  name: string;
  title: string;
  description: string | null;
  size: number | null;
  created_at: Date;
  updated_at: Date;
}

describe('Database Dataset Operations', () => {
  let dbClient: DbClient;

  beforeAll(() => {
    const config = getTestConfig();
    dbClient = new DbClient(config.database);
  });

  afterAll(async () => {
    await dbClient.close();
  });

  it('datasets table exists', async () => {
    const result = await dbClient.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'datasets'
      ) as exists`
    );
    expect(result?.exists).toBe(true);
  });

  it('can query all datasets', async () => {
    const datasets = await dbClient.queryAll<Dataset>('SELECT * FROM datasets ORDER BY id');
    expect(Array.isArray(datasets)).toBe(true);
  });

  it('datasets table contains 10 mock records', async () => {
    const result = await dbClient.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM datasets'
    );
    expect(result).toBeTruthy();
    expect(parseInt(result?.count ?? '0', 10)).toBe(10);
  });

  it('can query dataset by ID', async () => {
    const dataset = await dbClient.queryOne<Dataset>('SELECT * FROM datasets WHERE id = $1', [1]);
    expect(dataset).toBeTruthy();
    expect(dataset?.name).toBe('titanic');
  });

  it('can query datasets with pagination', async () => {
    const datasets = await dbClient.queryAll<Dataset>(
      'SELECT * FROM datasets ORDER BY id LIMIT $1 OFFSET $2',
      [5, 0]
    );
    expect(datasets.length).toBeLessThanOrEqual(5);
  });

  it('returns null for non-existent dataset', async () => {
    const dataset = await dbClient.queryOne<Dataset>('SELECT * FROM datasets WHERE id = $1', [
      9999,
    ]);
    expect(dataset).toBeNull();
  });

  it('datasets have required columns', async () => {
    const dataset = await dbClient.queryOne<Dataset>('SELECT * FROM datasets LIMIT 1');
    expect(dataset).toBeTruthy();
    expect(dataset).toHaveProperty('id');
    expect(dataset).toHaveProperty('name');
    expect(dataset).toHaveProperty('title');
    expect(dataset).toHaveProperty('created_at');
    expect(dataset).toHaveProperty('updated_at');
  });
});
