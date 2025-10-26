import { FastifyInstance } from 'fastify';
import { query } from '../../infrastructure/database.js';

/**
 * Database row type for type-safe queries
 */
interface DatasetRow {
  id: number;
  name: string;
  description: string | null;
  source_url: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Request/Response types for API contracts
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

interface ErrorResponse {
  error: string;
  message?: string;
}

interface DatasetResponse {
  dataset: DatasetRow;
}

interface DatasetsListResponse {
  datasets: DatasetRow[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}

/**
 * Validation error messages - single source of truth
 */
const VALIDATION_ERRORS = {
  DATASET_NAME_REQUIRED: 'Dataset name is required and must be a non-empty string',
  DATASET_NAME_INVALID: 'Dataset name must be a non-empty string',
  DATASET_ID_INVALID: 'Dataset ID must be a positive integer',
  DATASET_NOT_FOUND: 'Dataset not found',
  DUPLICATE_NAME: 'Dataset with this name already exists',
  NO_UPDATE_FIELDS: 'At least one field must be provided for update',
} as const;

/**
 * Explicit list of dataset columns for SELECT queries
 * Prevents fetching unnecessary columns and makes schema changes explicit
 */
const DATASET_COLUMNS = [
  'id',
  'name',
  'description',
  'source_url',
  'created_at',
  'updated_at',
].join(', ');

/**
 * Type for allowed update fields
 * Limits what fields clients can modify
 */
type UpdateField = 'name' | 'description' | 'source_url';

interface UpdateFieldConfig {
  field: UpdateField;
  key: keyof UpdateDatasetRequest;
}

/**
 * Extract error message and stack trace safely from any error type
 * Handles Error objects, strings, and unknown types
 */
function getErrorDetails(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  return { message: String(error) };
}

/**
 * Handle database errors with consistent response format
 * Logs detailed errors (including stack traces) server-side while returning safe messages to client
 *
 * @param fastify - Fastify instance for logging
 * @param error - The error that occurred
 * @param logContext - Additional context to include in logs
 * @param userMessage - Generic error message to send to client
 * @returns Error response object
 */
function handleDatabaseError(
  fastify: FastifyInstance,
  error: unknown,
  logContext: Record<string, unknown>,
  userMessage: string
): ErrorResponse {
  const errorDetails = getErrorDetails(error);
  fastify.log.error(
    { errorMessage: errorDetails.message, errorStack: errorDetails.stack, ...logContext },
    userMessage
  );

  return {
    error: userMessage,
    message: process.env['NODE_ENV'] === 'development' ? errorDetails.message : undefined,
  };
}

/**
 * Validate and parse pagination parameters
 * Extracts and sanitizes limit and offset from query string
 */
function parsePaginationParams(
  limitStr?: string,
  offsetStr?: string
): { limit: number; offset: number } {
  const limit = Math.min(Math.max(1, parseInt(limitStr || '100', 10)), 1000);
  const offset = Math.max(0, parseInt(offsetStr || '0', 10));
  return { limit, offset };
}

/**
 * Validate order parameter against allowed columns
 * Returns safe column name for ORDER BY clause
 */
function validateOrderParam(order?: string): string {
  const allowedColumns = ['name', 'id', 'created_at'];
  return allowedColumns.includes(order || '') ? (order as string) : 'name';
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
   * @returns {DatasetsListResponse} datasets array and pagination metadata
   * @throws {500} Database connection or query errors
   */
  fastify.get<{
    Querystring: { limit?: string; offset?: string; order?: string };
    Reply: DatasetsListResponse | ErrorResponse;
  }>('/datasets', async (request, reply): Promise<DatasetsListResponse | ErrorResponse> => {
    try {
      // Validate and sanitize query parameters using helper
      const { limit, offset } = parsePaginationParams(request.query.limit, request.query.offset);
      const order = validateOrderParam(request.query.order);

      // Use parameterized query to prevent SQL injection
      // The $1, $2 placeholders are filled safely by the pg library
      // Explicit column list instead of SELECT *
      const result = await query<DatasetRow>(
        `SELECT ${DATASET_COLUMNS} FROM datasets ORDER BY ${order} LIMIT $1 OFFSET $2`,
        [limit, offset] as const
      );

      return {
        datasets: result.rows,
        pagination: {
          limit,
          offset,
          count: result.rows.length,
        },
      };
    } catch (error: unknown) {
      reply.code(500);
      return handleDatabaseError(
        fastify,
        error,
        { query: request.query },
        'Failed to fetch datasets from database'
      );
    }
  });

  /**
   * POST /datasets
   * Create a new dataset
   *
   * Request Body:
   * - name: string (required, unique)
   * - description: string (optional)
   * - source_url: string (optional)
   *
   * @returns {DatasetResponse} created dataset with id and timestamps
   * @throws {400} Validation error (missing name or duplicate)
   * @throws {500} Database error
   */
  fastify.post<{
    Body: CreateDatasetRequest;
    Reply: DatasetResponse | ErrorResponse;
  }>('/datasets', async (request, reply): Promise<DatasetResponse | ErrorResponse> => {
    try {
      // Validate required fields
      const { name, description, source_url } = request.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        reply.code(400);
        return { error: VALIDATION_ERRORS.DATASET_NAME_REQUIRED };
      }

      // Insert dataset and return the created record
      const result = await query<DatasetRow>(
        `INSERT INTO datasets (name, description, source_url)
           VALUES ($1, $2, $3)
           RETURNING ${DATASET_COLUMNS}`,
        [name.trim(), description || null, source_url || null]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create dataset');
      }

      reply.code(201);
      return { dataset: result.rows[0]! };
    } catch (error: unknown) {
      const errorDetails = getErrorDetails(error);

      // Handle unique constraint violation
      if (
        errorDetails.message.includes('duplicate key') ||
        errorDetails.message.includes('unique')
      ) {
        reply.code(409);
        return { error: VALIDATION_ERRORS.DUPLICATE_NAME };
      }

      reply.code(500);
      return handleDatabaseError(
        fastify,
        error,
        { body: request.body },
        'Failed to create dataset'
      );
    }
  });

  /**
   * GET /datasets/:id
   * Fetch a single dataset by ID
   *
   * @param id - Dataset ID
   * @returns {DatasetResponse} dataset object
   * @throws {404} Dataset not found
   * @throws {500} Database error
   */
  fastify.get<{
    Params: { id: string };
    Reply: DatasetResponse | ErrorResponse;
  }>('/datasets/:id', async (request, reply): Promise<DatasetResponse | ErrorResponse> => {
    try {
      const id = parseInt(request.params.id, 10);

      if (isNaN(id) || id < 1) {
        reply.code(400);
        return { error: VALIDATION_ERRORS.DATASET_ID_INVALID };
      }

      const result = await query<DatasetRow>(
        `SELECT ${DATASET_COLUMNS} FROM datasets WHERE id = $1`,
        [id] as const
      );

      if (result.rows.length === 0) {
        reply.code(404);
        return { error: VALIDATION_ERRORS.DATASET_NOT_FOUND };
      }

      return { dataset: result.rows[0]! };
    } catch (error: unknown) {
      reply.code(500);
      return handleDatabaseError(
        fastify,
        error,
        { params: request.params },
        'Failed to fetch dataset'
      );
    }
  });

  /**
   * PUT /datasets/:id
   * Update a dataset with partial field support
   * Whitelist ensures only allowed fields can be updated
   * Removed N+1 query: relies on UPDATE RETURNING for 404 detection
   *
   * @param id - Dataset ID
   * Request Body (all optional, at least one required):
   * - name: string
   * - description: string | null
   * - source_url: string | null
   *
   * @returns {DatasetResponse} updated dataset
   * @throws {400} Invalid request or no fields to update
   * @throws {404} Dataset not found
   * @throws {409} Name already exists
   * @throws {500} Database error
   */
  fastify.put<{
    Params: { id: string };
    Body: UpdateDatasetRequest;
    Reply: DatasetResponse | ErrorResponse;
  }>('/datasets/:id', async (request, reply): Promise<DatasetResponse | ErrorResponse> => {
    try {
      const id = parseInt(request.params.id, 10);

      if (isNaN(id) || id < 1) {
        reply.code(400);
        return { error: VALIDATION_ERRORS.DATASET_ID_INVALID };
      }

      // Build dynamic update query using whitelist
      // Only allowed fields can be updated, preventing accidental modifications
      const fieldConfigs: UpdateFieldConfig[] = [
        { field: 'name', key: 'name' },
        { field: 'description', key: 'description' },
        { field: 'source_url', key: 'source_url' },
      ];

      const updates: Array<{ field: string; value: unknown }> = [];

      for (const config of fieldConfigs) {
        const value = request.body[config.key];
        if (value !== undefined) {
          // Validate name field specifically
          if (config.field === 'name') {
            if (typeof value !== 'string' || value.trim().length === 0) {
              reply.code(400);
              return { error: VALIDATION_ERRORS.DATASET_NAME_INVALID };
            }
            updates.push({ field: config.field, value: value.trim() });
          } else {
            updates.push({ field: config.field, value });
          }
        }
      }

      if (updates.length === 0) {
        reply.code(400);
        return { error: VALIDATION_ERRORS.NO_UPDATE_FIELDS };
      }

      // Build parameterized update query
      const updateClauses = updates.map((u, i) => `${u.field} = $${i + 1}`).join(', ');
      const params = [...updates.map((u) => u.value), id] as const;

      // Single query: UPDATE with RETURNING
      // Returns 0 rows if dataset doesn't exist (handled below)
      const result = await query<DatasetRow>(
        `UPDATE datasets SET ${updateClauses} WHERE id = $${updates.length + 1}
           RETURNING ${DATASET_COLUMNS}`,
        params
      );

      if (result.rows.length === 0) {
        reply.code(404);
        return { error: VALIDATION_ERRORS.DATASET_NOT_FOUND };
      }

      return { dataset: result.rows[0]! };
    } catch (error: unknown) {
      const errorDetails = getErrorDetails(error);

      // Handle unique constraint violation
      if (
        errorDetails.message.includes('duplicate key') ||
        errorDetails.message.includes('unique')
      ) {
        reply.code(409);
        return { error: VALIDATION_ERRORS.DUPLICATE_NAME };
      }

      reply.code(500);
      return handleDatabaseError(
        fastify,
        error,
        { params: request.params, body: request.body },
        'Failed to update dataset'
      );
    }
  });

  /**
   * DELETE /datasets/:id
   * Delete a dataset
   *
   * @param id - Dataset ID
   * @returns void (204 No Content on success)
   * @throws {404} Dataset not found
   * @throws {500} Database error
   */
  fastify.delete<{
    Params: { id: string };
    Reply: ErrorResponse | null;
  }>('/datasets/:id', async (request, reply): Promise<ErrorResponse | null> => {
    try {
      const id = parseInt(request.params.id, 10);

      if (isNaN(id) || id < 1) {
        reply.code(400);
        return { error: VALIDATION_ERRORS.DATASET_ID_INVALID };
      }

      const result = await query<{ id: number }>(
        'DELETE FROM datasets WHERE id = $1 RETURNING id',
        [id] as const
      );

      if (result.rows.length === 0) {
        reply.code(404);
        return { error: VALIDATION_ERRORS.DATASET_NOT_FOUND };
      }

      reply.code(204);
      return null;
    } catch (error: unknown) {
      reply.code(500);
      return handleDatabaseError(
        fastify,
        error,
        { params: request.params },
        'Failed to delete dataset'
      );
    }
  });
}
