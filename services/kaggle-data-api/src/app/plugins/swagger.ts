import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

/**
 * This plugin adds Swagger documentation
 * @see https://github.com/fastify/fastify-swagger
 */
async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Kaggle Data API',
        description: 'API for accessing processed Kaggle competition data',
        version: '0.1.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'health', description: 'Health check endpoints' },
        { name: 'info', description: 'API information endpoints' },
      ],
    },
  });
  const disableUi =
    process.env['DISABLE_SWAGGER_UI'] === 'true' ||
    process.env['BUNDLE_RUNTIME'] === 'true' ||
    process.env['NODE_ENV'] === 'production';
  if (disableUi) {
    fastify.get('/docs', async () => {
      return {
        message: 'Swagger UI disabled in this build',
        json: '/json',
      };
    });
  } else {
    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      staticCSP: true,
    });
  }
}

export default fastifyPlugin(swaggerPlugin);
