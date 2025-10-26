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
  // Checks database connectivity
  fastify.get(
    '/health/ready',
    {
      schema: {
        tags: ['health'],
        description: 'Kubernetes readiness probe - checks dependencies',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              database: { type: 'string' },
              checks: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                },
              },
            },
          },
          503: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              database: { type: 'string' },
              checks: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                },
              },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const checks: { database: string } = {
        database: 'unknown',
      };

      // Check database connectivity
      try {
        const result = await fastify.db.query('SELECT 1 as health');
        checks.database = result.rows[0]?.['health'] === 1 ? 'healthy' : 'unhealthy';
      } catch (error) {
        checks.database = 'unhealthy';
        fastify.log.warn({ err: error }, 'Database health check failed');
        return reply.code(503).send({
          status: 'not_ready',
          database: checks.database,
          checks,
          error: 'Database connectivity check failed',
        });
      }

      // All checks passed
      return {
        status: 'ready',
        database: checks.database,
        checks,
      };
    }
  );
}
