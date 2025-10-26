import { FastifyInstance } from 'fastify';

/**
 * Health check endpoints for Kubernetes probes
 */
export default async function (fastify: FastifyInstance) {
  // Basic health check
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        description: 'Basic health check endpoint',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  );

  // Liveness probe - checks if the application is running
  fastify.get(
    '/health/live',
    {
      schema: {
        tags: ['health'],
        description: 'Kubernetes liveness probe',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
            },
          },
        },
      },
    },
    async () => ({
      status: 'alive',
    })
  );

  // Readiness probe - checks if the application is ready to accept traffic
  // In future, this should check database connectivity
  fastify.get(
    '/health/ready',
    {
      schema: {
        tags: ['health'],
        description: 'Kubernetes readiness probe',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              checks: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                  redis: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async () => ({
      status: 'ready',
      checks: {
        // TODO: Add actual database and Redis connectivity checks
        database: 'not_configured',
        redis: 'not_configured',
      },
    })
  );
}
