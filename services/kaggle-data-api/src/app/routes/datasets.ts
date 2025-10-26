import { FastifyInstance, FastifyRequest } from 'fastify';
import { query } from '../../infrastructure/database.js';

/**
 * Datasets routes - fetch Kaggle datasets from PostgreSQL
 *
 * Security Note:
 * - All queries use parameterized statements to prevent SQL injection
 * - User input is never directly interpolated into SQL strings
 * - The pg library handles parameter escaping automatically
 */
export default async function (fastify: FastifyInstance) {
  /**
   * GET /datasets
   * Fetch all datasets from the database, with optional filtering
   *
   * Query Parameters (optional):
   * - limit: number (default 100, max 1000)
   * - offset: number (default 0)
   * - order: 'name' | 'id' | 'created_at' (default 'name')
   *
   * Example: GET /datasets?limit=50&offset=0&order=name
   *
   * @returns {object} datasets array and pagination metadata
   * @throws {500} Database connection or query errors
   */
  fastify.get(
    '/datasets',
    async (
      request: FastifyRequest<{ Querystring: { limit?: string; offset?: string; order?: string } }>,
      reply
    ) => {
      try {
        // Validate and sanitize query parameters
        const limit = Math.min(Math.max(1, parseInt(request.query.limit || '100', 10)), 1000);
        const offset = Math.max(0, parseInt(request.query.offset || '0', 10));
        const allowedOrder = ['name', 'id', 'created_at'];
        const order = (
          allowedOrder.includes(request.query.order || '') ? request.query.order : 'name'
        ) as string;

        // Use parameterized query to prevent SQL injection
        // The $1, $2, $3 placeholders are filled safely by the pg library
        const result = await query(`SELECT * FROM datasets ORDER BY ${order} LIMIT $1 OFFSET $2`, [
          limit,
          offset,
        ]);

        return {
          datasets: result.rows,
          pagination: {
            limit,
            offset,
            count: result.rows.length,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Log detailed error for debugging
        fastify.log.error({ error, query: request.query }, 'Failed to fetch datasets');

        // Return generic error to client for security
        reply.code(500);
        return {
          error: 'Failed to fetch datasets from database',
          message: process.env['NODE_ENV'] === 'development' ? errorMessage : undefined,
        };
      }
    }
  );
}
