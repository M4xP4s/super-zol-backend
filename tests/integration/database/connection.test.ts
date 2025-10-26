/**
 * Database Connection Integration Tests
 * Tests PostgreSQL connectivity and basic operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DbClient } from '../helpers/db-client.js';
import { getTestConfig } from '../helpers/test-config.js';

describe('Database Connection', () => {
  let dbClient: DbClient;

  beforeAll(() => {
    const config = getTestConfig();
    dbClient = new DbClient(config.database);
  });

  afterAll(async () => {
    await dbClient.close();
  });

  it('can connect to PostgreSQL', async () => {
    const connected = await dbClient.checkConnection();
    expect(connected).toBe(true);
  });

  it('can execute simple query', async () => {
    const result = await dbClient.queryOne<{ result: number }>('SELECT 1 + 1 as result');
    expect(result).toBeTruthy();
    expect(result?.result).toBe(2);
  });

  it('can query database version', async () => {
    const result = await dbClient.queryOne<{ version: string }>('SELECT version() as version');
    expect(result).toBeTruthy();
    expect(result?.version).toContain('PostgreSQL');
  });
});
