import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import cors from '@fastify/cors';

/**
 * This plugin adds CORS support
 * @see https://github.com/fastify/fastify-cors
 */
async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: true, // Allow all origins in development (configure per environment in production)
    credentials: true,
  });
}

export default fastifyPlugin(corsPlugin);
