import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import helmet from '@fastify/helmet';

/**
 * This plugin adds security headers via helmet
 * @see https://github.com/fastify/fastify-helmet
 */
async function helmetPlugin(fastify: FastifyInstance) {
  await fastify.register(helmet, {
    // Configure for Swagger UI compatibility
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
      },
    },
  });
}

export default fastifyPlugin(helmetPlugin);
