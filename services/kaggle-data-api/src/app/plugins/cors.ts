import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import cors from '@fastify/cors';

/**
 * This plugin adds CORS support with environment-aware configuration
 * @see https://github.com/fastify/fastify-cors
 */
async function corsPlugin(fastify: FastifyInstance) {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];

  await fastify.register(cors, {
    // In production, only allow specific origins from env var
    // In development, allow all origins for easier testing
    origin: isProduction
      ? allowedOrigins.length > 0
        ? allowedOrigins
        : false // Deny all if no origins specified in production
      : true, // Allow all in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}

export default fastifyPlugin(corsPlugin);
