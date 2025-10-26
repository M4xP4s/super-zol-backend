import { FastifyInstance } from 'fastify';

/**
 * Root route providing API information
 */
export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['info'],
        description: 'API root endpoint',
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              version: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async () => ({
      message: 'Hello from Kaggle Data API',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    })
  );

  fastify.get(
    '/v1/info',
    {
      schema: {
        tags: ['info'],
        description: 'Detailed API information',
        response: {
          200: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              description: { type: 'string' },
              uptime: { type: 'number' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async () => ({
      name: 'Kaggle Data API',
      version: '0.1.0',
      description: 'API for accessing processed Kaggle competition data',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  );
}
