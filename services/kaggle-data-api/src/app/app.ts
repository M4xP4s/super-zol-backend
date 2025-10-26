import { join } from 'node:path';
import Fastify, { FastifyInstance } from 'fastify';
import AutoLoad from '@fastify/autoload';
import { getDirname } from '@libs/shared-util';

const __dirname = getDirname(import.meta.url);

/* eslint-disable-next-line */
export interface AppOptions {}

export async function app(fastify: FastifyInstance, opts: AppOptions) {
  // Place here your custom code!

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: { ...opts },
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: { ...opts },
  });
}

/**
 * Build a Fastify instance for testing purposes
 * Manually registers plugins and routes to avoid AutoLoad .ts file issues in tests
 */
export async function build(opts: AppOptions = {}) {
  const fastify = Fastify({
    logger: false, // Disable logging in tests
  });

  // Manually register plugins
  const sensiblePlugin = await import('./plugins/sensible.js');
  await fastify.register(sensiblePlugin.default, opts);

  const corsPlugin = await import('./plugins/cors.js');
  await fastify.register(corsPlugin.default, opts);

  const helmetPlugin = await import('./plugins/helmet.js');
  await fastify.register(helmetPlugin.default, opts);

  const rateLimitPlugin = await import('./plugins/rate-limit.js');
  await fastify.register(rateLimitPlugin.default, opts);

  const swaggerPlugin = await import('./plugins/swagger.js');
  await fastify.register(swaggerPlugin.default, opts);

  // Manually register routes
  const rootRoute = await import('./routes/root.js');
  await fastify.register(rootRoute.default, opts);

  const healthRoute = await import('./routes/health.js');
  await fastify.register(healthRoute.default, opts);

  await fastify.ready();

  return fastify;
}
