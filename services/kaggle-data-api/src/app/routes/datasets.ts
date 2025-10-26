import { FastifyInstance } from 'fastify';

/**
 * Dataset routes for Kaggle data
 */
export default async function (fastify: FastifyInstance) {
  /**
   * GET /datasets
   *
   * Returns a list of all datasets from the database
   */
  fastify.get(
    '/datasets',
    {
      schema: {
        tags: ['datasets'],
        description: 'Get all datasets from the database',
        querystring: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Maximum number of datasets to return',
            },
            offset: {
              type: 'number',
              minimum: 0,
              default: 0,
              description: 'Number of datasets to skip',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              datasets: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    url: { type: 'string' },
                    created_at: { type: 'string' },
                  },
                },
              },
              total: { type: 'number' },
              limit: { type: 'number' },
              offset: { type: 'number' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { limit = 20, offset = 0 } = request.query as {
        limit?: number;
        offset?: number;
      };

      try {
        // Query datasets with pagination
        const result = await fastify.db.query(
          `
          SELECT
            id,
            name,
            title,
            description,
            url,
            created_at
          FROM datasets
          ORDER BY created_at DESC
          LIMIT $1 OFFSET $2
          `,
          [limit, offset]
        );

        // Get total count
        const countResult = await fastify.db.query('SELECT COUNT(*) as count FROM datasets');
        const total = parseInt(countResult.rows[0]?.['count'] ?? '0', 10);

        return {
          datasets: result.rows,
          total,
          limit,
          offset,
        };
      } catch (error) {
        fastify.log.error({ err: error }, 'Failed to fetch datasets');
        return reply.code(500).send({
          error: 'DatabaseError',
          message: 'Failed to fetch datasets from database',
        });
      }
    }
  );

  /**
   * GET /datasets/:id
   *
   * Returns a specific dataset by ID
   */
  fastify.get(
    '/datasets/:id',
    {
      schema: {
        tags: ['datasets'],
        description: 'Get a specific dataset by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'number',
              description: 'Dataset ID',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string', nullable: true },
              url: { type: 'string' },
              created_at: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };

      try {
        const result = await fastify.db.query(
          `
          SELECT
            id,
            name,
            title,
            description,
            url,
            created_at
          FROM datasets
          WHERE id = $1
          `,
          [id]
        );

        if (result.rows.length === 0) {
          return reply.code(404).send({
            error: 'NotFound',
            message: `Dataset with ID ${id} not found`,
          });
        }

        return result.rows[0];
      } catch (error) {
        fastify.log.error({ err: error }, `Failed to fetch dataset ${id}`);
        return reply.code(500).send({
          error: 'DatabaseError',
          message: 'Failed to fetch dataset from database',
        });
      }
    }
  );
}
