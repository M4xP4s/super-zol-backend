import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

/**
 * This plugin adds rate limiting to protect the API from abuse
 * @see https://github.com/fastify/fastify-rate-limit
 */
async function rateLimitPlugin(fastify: FastifyInstance) {
  const isProduction = process.env.NODE_ENV === 'production';

  await fastify.register(rateLimit, {
    // In production: 100 requests per minute per IP
    // In development: 1000 requests per minute for easier testing
    max: isProduction ? 100 : 1000,
    timeWindow: '1 minute',
    cache: 10000, // Keep track of 10k IPs
    allowList: [], // No IPs whitelisted by default
    continueExceeding: true, // Continue to track rate limit violations
    skipOnError: false, // Don't skip rate limiting on errors
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });
}

export default fastifyPlugin(rateLimitPlugin);
