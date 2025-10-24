import * as path from 'path';
import Fastify, { FastifyInstance } from 'fastify';
import AutoLoad from '@fastify/autoload';

/* eslint-disable-next-line */
export interface AppOptions {}

export async function app(fastify: FastifyInstance, opts: AppOptions) {
  // Place here your custom code!

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: { ...opts },
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
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

  // Manually register sensible plugin
  const sensiblePlugin = await import('./plugins/sensible');
  await fastify.register(sensiblePlugin.default, opts);

  // Manually register root route
  const rootRoute = await import('./routes/root');
  await fastify.register(rootRoute.default, opts);

  await fastify.ready();

  return fastify;
}
