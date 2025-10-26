import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import sensible from '@fastify/sensible';

/**
 * Plugin metadata for introspection
 * Allows other code to discover plugin dependencies and capabilities
 */
export const sensiblePluginMetadata = {
  name: 'sensible',
  dependencies: [] as string[],
  description: 'HTTP error handling utilities',
  version: '1.0.0',
} as const;

/**
 * Register the sensible plugin which adds HTTP error handling utilities
 * Provides convenient methods for responding with common HTTP errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
export default fp(
  async function (fastify: FastifyInstance) {
    fastify.register(sensible);
  },
  {
    name: sensiblePluginMetadata.name,
  }
);
