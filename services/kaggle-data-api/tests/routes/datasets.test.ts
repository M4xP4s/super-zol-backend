import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { build } from '../../src/app/app.js';
import { FastifyInstance } from 'fastify';

describe('Datasets Routes', () => {
  let app: FastifyInstance;

  // Mock database query results
  const mockDatasets = [
    {
      id: 1,
      name: 'titanic',
      title: 'Titanic: Machine Learning from Disaster',
      description: 'Start here! Predict survival on the Titanic and get familiar with ML basics',
      url: 'https://www.kaggle.com/c/titanic',
      created_at: new Date('2024-01-01').toISOString(),
    },
    {
      id: 2,
      name: 'house-prices',
      title: 'House Prices - Advanced Regression Techniques',
      description: 'Predict sales prices and practice feature engineering',
      url: 'https://www.kaggle.com/c/house-prices',
      created_at: new Date('2024-01-02').toISOString(),
    },
  ];

  beforeEach(async () => {
    app = await build();

    // Mock the database pool
    app.db = {
      query: vi.fn(),
      connect: vi.fn(),
      end: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /datasets', () => {
    it('should return a list of datasets', async () => {
      // Mock query implementation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (app.db.query as any).mockImplementation((sql: string) => {
        if (sql.includes('SELECT COUNT(*)')) {
          return Promise.resolve({ rows: [{ count: '2' }] });
        }
        return Promise.resolve({ rows: mockDatasets });
      });

      const response = await app.inject({
        method: 'GET',
        url: '/datasets',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('datasets');
      expect(data).toHaveProperty('total');
      expect(data.datasets).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should support pagination with limit and offset', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (app.db.query as any).mockImplementation((sql: string, params?: unknown[]) => {
        if (sql.includes('SELECT COUNT(*)')) {
          return Promise.resolve({ rows: [{ count: '10' }] });
        }
        // Check that limit and offset are passed correctly
        expect(params).toEqual([5, 10]);
        return Promise.resolve({ rows: mockDatasets.slice(0, 1) });
      });

      const response = await app.inject({
        method: 'GET',
        url: '/datasets?limit=5&offset=10',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.limit).toBe(5);
      expect(data.offset).toBe(10);
      expect(data.total).toBe(10);
    });

    it('should handle database errors gracefully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (app.db.query as any).mockRejectedValue(new Error('Database connection failed'));

      const response = await app.inject({
        method: 'GET',
        url: '/datasets',
      });

      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('DatabaseError');
    });

    it('should validate query parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/datasets?limit=1000', // Exceeds maximum
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /datasets/:id', () => {
    it('should return a specific dataset by ID', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (app.db.query as any).mockResolvedValue({ rows: [mockDatasets[0]] });

      const response = await app.inject({
        method: 'GET',
        url: '/datasets/1',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.id).toBe(1);
      expect(data.name).toBe('titanic');
      expect(data.title).toBe('Titanic: Machine Learning from Disaster');
    });

    it('should return 404 when dataset not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (app.db.query as any).mockResolvedValue({ rows: [] });

      const response = await app.inject({
        method: 'GET',
        url: '/datasets/9999',
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('NotFound');
    });

    it('should handle database errors gracefully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (app.db.query as any).mockRejectedValue(new Error('Database error'));

      const response = await app.inject({
        method: 'GET',
        url: '/datasets/1',
      });

      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.payload);
      expect(data.error).toBe('DatabaseError');
    });

    it('should pass the correct ID parameter to database', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (app.db.query as any).mockImplementation((sql: string, params?: unknown[]) => {
        expect(params).toEqual([42]);
        return Promise.resolve({ rows: [{ ...mockDatasets[0], id: 42 }] });
      });

      const response = await app.inject({
        method: 'GET',
        url: '/datasets/42',
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
