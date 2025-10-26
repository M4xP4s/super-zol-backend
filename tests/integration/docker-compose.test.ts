/**
 * Docker Compose Integration Tests
 * Tests that verify the kaggle-data-api service works with PostgreSQL via docker-compose
 */

import { describe, it, expect } from 'vitest';

describe('Docker Compose Integration', () => {
  it('should have docker-compose.integration.yml configured', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.resolve(process.cwd(), 'docker-compose.integration.yml');
    const content = await fs.readFile(filePath, 'utf-8');

    // Verify services are configured
    expect(content).toContain('postgres');
    expect(content).toContain('kaggle-data-api');

    // Verify environment variables
    expect(content).toContain('POSTGRES_DB: test_db');
    expect(content).toContain('POSTGRES_USER: test_user');
    expect(content).toContain(
      'DATABASE_URL: postgresql://test_user:test_password@postgres:5432/test_db'
    );

    // Verify health checks
    expect(content).toContain('healthcheck');
    expect(content).toContain('pg_isready');
  });

  it('should have kaggle-data-api Dockerfile', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.resolve(process.cwd(), 'services/kaggle-data-api/Dockerfile');
    const content = await fs.readFile(filePath, 'utf-8');

    // Verify multi-stage build
    expect(content).toContain('FROM node:22-alpine AS builder');
    expect(content).toContain('FROM node:22-alpine');

    // Verify non-root user
    expect(content).toContain('adduser --system --uid 1001 fastify');

    // Verify port exposure
    expect(content).toContain('EXPOSE 3000');
  });

  it('should have .dockerignore for kaggle-data-api', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.resolve(process.cwd(), 'services/kaggle-data-api/.dockerignore');
    const content = await fs.readFile(filePath, 'utf-8');

    // Verify key exclusions
    expect(content).toContain('node_modules');
    expect(content).toContain('dist');
    expect(content).toContain('coverage');
  });
});
