import * as path from 'path';
import Fastify, { FastifyInstance } from 'fastify';
import AutoLoad from '@fastify/autoload';
import { getDirname } from '@libs/shared-util';

/* eslint-disable-next-line */
export interface AppOptions {}

export async function app(fastify: FastifyInstance, opts: AppOptions) {
  // Place here your custom code!

  // Do not touch the following lines

  const __dirname = getDirname(import.meta.url);

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
 * Build a Fastify instance for testing
 */
export async function build(opts: AppOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: false });
  await fastify.register(app, opts);
  await fastify.ready();
  return fastify;
}
