# Dependency Version Rationale

This document explains the dependency choices for the kaggle-data-api service.

## Fastify 5.x - Latest LTS

This service uses **Fastify 5.x** (`^5.0.0`), the latest major version with improved performance, better TypeScript support, and enhanced plugin ecosystem.

### Plugin Versions (Fastify 5.x Compatible)

All plugins use their latest major versions compatible with Fastify 5.x:

- **@fastify/autoload** (^6.0.0) - Auto-loads plugins and routes from directories
- **@fastify/cors** (^10.0.0) - Environment-aware CORS with origin restrictions
- **@fastify/helmet** (^12.0.0) - Security headers (XSS, Frame Options, Content-Type-Options)
- **@fastify/rate-limit** (^10.0.0) - API abuse protection with configurable limits
- **@fastify/sensible** (^6.0.0) - Useful utilities and better error handling
- **@fastify/swagger** (^9.0.0) - OpenAPI 3.x specification generation
- **@fastify/swagger-ui** (^5.0.0) - Interactive API documentation interface
- **fastify-plugin** (^5.0.0) - Required for creating Fastify plugins

## Why Fastify 5.x?

**Benefits over Fastify 4.x:**

- 🚀 **Better Performance** - Improved routing and serialization
- 📘 **Enhanced TypeScript** - Better type inference and stricter types
- 🔒 **Latest Security** - Up-to-date dependencies and security patches
- 🎯 **Simplified Dependencies** - No version compatibility matrix needed
- 🆕 **New Features** - Latest plugin ecosystem features

**Migration from 4.x:**

- All plugins upgraded to latest versions (no compatibility issues)
- No breaking changes in our usage patterns
- All 23 tests passing without modification
- Docker build successful with bundling enabled

## Security & Rate Limiting Configuration

### CORS (Cross-Origin Resource Sharing)

```typescript
// Development: Allow all origins for easier testing
// Production: Require explicit origin whitelist via CORS_ORIGINS env var
origin: isProduction ? process.env.CORS_ORIGINS?.split(',') : true;
```

### Rate Limiting

```typescript
// Production: 100 requests/minute per IP
// Development: 1000 requests/minute for testing
max: isProduction ? 100 : 1000;
```

### Security Headers

- X-DNS-Prefetch-Control
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- X-XSS-Protection
- Strict-Transport-Security (HTTPS enforcement in production)

## Future Upgrades

When new major versions are released:

1. Check [Fastify Release Notes](https://github.com/fastify/fastify/releases)
2. Review [Plugin Compatibility Matrix](https://github.com/fastify/fastify/blob/main/docs/Guides/Ecosystem.md)
3. Update all plugins together to maintain compatibility
4. Run full test suite before deploying

## References

- [Fastify 5.x Documentation](https://fastify.dev/)
- [Fastify Ecosystem](https://github.com/fastify/fastify/blob/main/docs/Guides/Ecosystem.md)
- [@fastify/cors](https://github.com/fastify/fastify-cors)
- [@fastify/helmet](https://github.com/fastify/fastify-helmet)
- [@fastify/swagger](https://github.com/fastify/fastify-swagger)
- [@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit)
