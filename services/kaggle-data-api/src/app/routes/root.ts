import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/', async function () {
    return { message: 'Hello API' };
  });

  /**
   * Health check endpoint for load balancers and monitoring
   * Returns 200 OK if the service is running
   */
  fastify.get('/health', async function () {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}
