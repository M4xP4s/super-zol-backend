import { FastifyInstance } from 'fastify';
import { query } from '../../infrastructure/database.js';

/**
 * Datasets routes - fetch Kaggle datasets from PostgreSQL
 */
export default async function (fastify: FastifyInstance) {
  /**
   * GET /datasets
   * Fetch all datasets from the database
   */
  fastify.get('/datasets', async (request, reply) => {
    try {
      const result = await query('SELECT * FROM datasets ORDER BY name');
      return { datasets: result.rows };
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch datasets');
      reply.code(500);
      return { error: 'Failed to fetch datasets from database' };
    }
  });
}
