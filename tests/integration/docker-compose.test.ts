/**
 * Docker Compose Integration Tests
 * Tests that verify the kaggle-data-api service configuration and deployment readiness
 *
 * Note: These tests validate the configuration and setup. Full integration testing with
 * docker-compose up requires a Docker daemon and is typically run in CI/CD pipelines.
 */

import { describe, it, expect } from 'vitest';
import YAML from 'yaml';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

describe('Docker Compose Integration', () => {
  it('should have valid docker-compose.integration.yml configuration', async () => {
    const filePath = resolve(process.cwd(), 'docker-compose.integration.yml');
    const content = await readFile(filePath, 'utf-8');

    // Parse YAML to ensure valid syntax
    const config = YAML.parse(content);
    expect(config).toBeDefined();
    expect(config.version).toBe('3.8');
    expect(config.services).toBeDefined();
  });

  it('should configure postgres service correctly', async () => {
    const filePath = resolve(process.cwd(), 'docker-compose.integration.yml');
    const content = await readFile(filePath, 'utf-8');
    const config = YAML.parse(content);

    const postgresService = config.services.postgres;
    expect(postgresService).toBeDefined();
    expect(postgresService.image).toBe('postgres:16-alpine');
    expect(postgresService.environment.POSTGRES_DB).toBe('test_db');
    expect(postgresService.environment.POSTGRES_USER).toBe('test_user');
    expect(postgresService.ports).toContain('5432:5432');
    expect(postgresService.healthcheck).toBeDefined();
    // healthcheck.test is an array, check if any element contains pg_isready
    const healthcheckStr = postgresService.healthcheck.test.join(' ');
    expect(healthcheckStr).toContain('pg_isready');
  });

  it('should configure kaggle-data-api service correctly', async () => {
    const filePath = resolve(process.cwd(), 'docker-compose.integration.yml');
    const content = await readFile(filePath, 'utf-8');
    const config = YAML.parse(content);

    const apiService = config.services['kaggle-data-api'];
    expect(apiService).toBeDefined();
    expect(apiService.build.dockerfile).toBe('services/kaggle-data-api/Dockerfile');
    expect(apiService.ports).toContain('3000:3000');
    expect(apiService.environment.DATABASE_URL).toContain('postgresql://');
    expect(apiService.depends_on.postgres).toBeDefined();
    expect(apiService.healthcheck).toBeDefined();
    // healthcheck.test is an array, check if any element contains /health
    const healthcheckStr = apiService.healthcheck.test.join(' ');
    expect(healthcheckStr).toContain('/health');
  });

  it('should have kaggle-data-api Dockerfile with multi-stage build', async () => {
    const filePath = resolve(process.cwd(), 'services/kaggle-data-api/Dockerfile');
    const content = await readFile(filePath, 'utf-8');

    // Verify multi-stage build
    expect(content).toContain('FROM node:22-alpine AS builder');
    expect(content).toContain('FROM node:22-alpine');

    // Verify non-root user for security
    expect(content).toContain('adduser --system --uid 1001 fastify');
    expect(content).toContain('USER fastify');

    // Verify port exposure
    expect(content).toContain('EXPOSE 3000');

    // Verify proper startup command
    expect(content).toContain('CMD ["node", "main.js"]');
  });

  it('should have .dockerignore for optimized builds', async () => {
    const filePath = resolve(process.cwd(), 'services/kaggle-data-api/.dockerignore');
    const content = await readFile(filePath, 'utf-8');

    // Verify key exclusions for performance
    expect(content).toContain('node_modules');
    expect(content).toContain('dist');
    expect(content).toContain('coverage');
    expect(content).toContain('.git');
  });

  it('should have database module with proper export functions', async () => {
    const filePath = resolve(
      process.cwd(),
      'services/kaggle-data-api/src/infrastructure/database.ts'
    );
    const content = await readFile(filePath, 'utf-8');

    // Verify singleton pool pattern
    expect(content).toContain('let pool: Pool | null = null');
    expect(content).toContain('function getPool(): Pool');

    // Verify exported functions
    expect(content).toContain('export function getDatabaseUrl');
    expect(content).toContain('export function getPool');
    expect(content).toContain('export async function query');
    expect(content).toContain('export async function getClient');
    expect(content).toContain('export async function closePool');

    // Verify efficient connection pooling
    expect(content).toContain('if (!pool)');
  });

  it('should have datasets route with error handling', async () => {
    const filePath = resolve(process.cwd(), 'services/kaggle-data-api/src/app/routes/datasets.ts');
    const content = await readFile(filePath, 'utf-8');

    // Verify route definition
    expect(content).toContain("fastify.get('/datasets'");

    // Verify proper error handling
    expect(content).toContain('try');
    expect(content).toContain('catch');
    expect(content).toContain('reply.code(500)');

    // Verify database query
    expect(content).toContain('query(');
  });

  it('should have health check endpoint', async () => {
    const filePath = resolve(process.cwd(), 'services/kaggle-data-api/src/app/routes/root.ts');
    const content = await readFile(filePath, 'utf-8');

    // Verify health endpoint exists
    expect(content).toContain("fastify.get('/health'");
    expect(content).toContain('status');
    expect(content).toContain('ok');
  });
});
