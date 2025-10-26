import { FastifyInstance, FastifyRequest } from 'fastify';
import { query } from '../../infrastructure/database.js';

/**
 * Dataset schema for validation and type safety
 */
interface CreateDatasetRequest {
  name: string;
  description?: string;
  source_url?: string;
}

interface UpdateDatasetRequest {
  name?: string;
  description?: string | null;
  source_url?: string | null;
}

/**
 * Datasets routes - CRUD operations for Kaggle datasets
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

  /**
   * POST /datasets
   * Create a new dataset
   *
   * Request Body:
   * - name: string (required, unique)
   * - description: string (optional)
   * - source_url: string (optional)
   *
   * @returns {object} created dataset with id and timestamps
   * @throws {400} Validation error (missing name or duplicate)
   * @throws {500} Database error
   */
  fastify.post<{ Body: CreateDatasetRequest }>('/datasets', async (request, reply) => {
    try {
      // Validate required fields
      const { name, description, source_url } = request.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        reply.code(400);
        return { error: 'Dataset name is required and must be a non-empty string' };
      }

      // Insert dataset and return the created record
      const result = await query(
        `INSERT INTO datasets (name, description, source_url)
           VALUES ($1, $2, $3)
           RETURNING id, name, description, source_url, created_at, updated_at`,
        [name.trim(), description || null, source_url || null]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create dataset');
      }

      reply.code(201);
      return { dataset: result.rows[0] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      fastify.log.error({ error, body: request.body }, 'Failed to create dataset');

      // Handle unique constraint violation
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique')) {
        reply.code(409);
        return { error: 'Dataset with this name already exists' };
      }

      reply.code(500);
      return {
        error: 'Failed to create dataset',
        message: process.env['NODE_ENV'] === 'development' ? errorMessage : undefined,
      };
    }
  });

  /**
   * GET /datasets/:id
   * Fetch a single dataset by ID
   *
   * @param {number} id - Dataset ID
   * @returns {object} dataset object
   * @throws {404} Dataset not found
   * @throws {500} Database error
   */
  fastify.get<{ Params: { id: string } }>('/datasets/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id, 10);

      if (isNaN(id) || id < 1) {
        reply.code(400);
        return { error: 'Dataset ID must be a positive integer' };
      }

      const result = await query('SELECT * FROM datasets WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        reply.code(404);
        return { error: 'Dataset not found' };
      }

      return { dataset: result.rows[0] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      fastify.log.error({ error, params: request.params }, 'Failed to fetch dataset');

      reply.code(500);
      return {
        error: 'Failed to fetch dataset',
        message: process.env['NODE_ENV'] === 'development' ? errorMessage : undefined,
      };
    }
  });

  /**
   * PUT /datasets/:id
   * Update a dataset
   *
   * @param {number} id - Dataset ID
   * Request Body (all optional, at least one required):
   * - name: string
   * - description: string | null
   * - source_url: string | null
   *
   * @returns {object} updated dataset
   * @throws {400} Invalid request or no fields to update
   * @throws {404} Dataset not found
   * @throws {409} Name already exists
   * @throws {500} Database error
   */
  fastify.put<{ Params: { id: string }; Body: UpdateDatasetRequest }>(
    '/datasets/:id',
    async (request, reply) => {
      try {
        const id = parseInt(request.params.id, 10);

        if (isNaN(id) || id < 1) {
          reply.code(400);
          return { error: 'Dataset ID must be a positive integer' };
        }

        const { name, description, source_url } = request.body;

        // Check if dataset exists
        const existsResult = await query('SELECT id FROM datasets WHERE id = $1', [id]);
        if (existsResult.rows.length === 0) {
          reply.code(404);
          return { error: 'Dataset not found' };
        }

        // Build dynamic update query
        const updates: string[] = [];
        const params: unknown[] = [];
        let paramIndex = 1;

        if (name !== undefined) {
          if (typeof name !== 'string' || name.trim().length === 0) {
            reply.code(400);
            return { error: 'Dataset name must be a non-empty string' };
          }
          updates.push(`name = $${paramIndex}`);
          params.push(name.trim());
          paramIndex++;
        }

        if (description !== undefined) {
          updates.push(`description = $${paramIndex}`);
          params.push(description);
          paramIndex++;
        }

        if (source_url !== undefined) {
          updates.push(`source_url = $${paramIndex}`);
          params.push(source_url);
          paramIndex++;
        }

        if (updates.length === 0) {
          reply.code(400);
          return { error: 'At least one field must be provided for update' };
        }

        params.push(id);

        const result = await query(
          `UPDATE datasets SET ${updates.join(', ')} WHERE id = $${paramIndex}
           RETURNING id, name, description, source_url, created_at, updated_at`,
          params
        );

        if (result.rows.length === 0) {
          throw new Error('Failed to update dataset');
        }

        return { dataset: result.rows[0] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        fastify.log.error(
          { error, params: request.params, body: request.body },
          'Failed to update dataset'
        );

        // Handle unique constraint violation
        if (errorMessage.includes('duplicate key') || errorMessage.includes('unique')) {
          reply.code(409);
          return { error: 'Dataset with this name already exists' };
        }

        reply.code(500);
        return {
          error: 'Failed to update dataset',
          message: process.env['NODE_ENV'] === 'development' ? errorMessage : undefined,
        };
      }
    }
  );

  /**
   * DELETE /datasets/:id
   * Delete a dataset
   *
   * @param {number} id - Dataset ID
   * @returns {object} success message
   * @throws {404} Dataset not found
   * @throws {500} Database error
   */
  fastify.delete<{ Params: { id: string } }>('/datasets/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id, 10);

      if (isNaN(id) || id < 1) {
        reply.code(400);
        return { error: 'Dataset ID must be a positive integer' };
      }

      const result = await query('DELETE FROM datasets WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        reply.code(404);
        return { error: 'Dataset not found' };
      }

      reply.code(204);
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      fastify.log.error({ error, params: request.params }, 'Failed to delete dataset');

      reply.code(500);
      return {
        error: 'Failed to delete dataset',
        message: process.env['NODE_ENV'] === 'development' ? errorMessage : undefined,
      };
    }
  });
}
