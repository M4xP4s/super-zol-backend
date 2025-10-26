# Docker Bundling Guide

This document describes how to bundle services and jobs with Docker images for deployment.

## Quick Start

### Bundle a Single Service with Docker

```bash
just bundle kaggle-data-api
```

### Bundle Specific Service (esbuild only, no Docker)

```bash
just bundle-esbuild kaggle-data-api
```

### Bundle All Services with Docker

```bash
just bundle-all
```

### Using Nx Directly

Bundle targets are also available via Nx:

```bash
# Bundle with minification and bundling
pnpm nx bundle kaggle-data-api

# Build Docker image (requires bundle to complete first)
pnpm nx docker kaggle-data-api
```

## Bundle Process

### What `just bundle` Does

1. **Compilation**: Builds the service with esbuild
   - Compiles TypeScript to optimized JavaScript
   - Minifies code for production
   - Bundles dependencies into single output files
   - Generates optimized package.json

2. **Docker Image Build**: Creates a Docker image if Dockerfile exists
   - Builds multi-stage image for size optimization
   - Tags with `<service-name>:latest`
   - Resets Nx cache to avoid machine ID issues in Docker

### Example Output

```
🔨 Building service: kaggle-data-api
📦 Running esbuild compilation...
✅ Build completed: dist/services/kaggle-data-api
🐳 Building Docker image: kaggle-data-api:latest
✅ Docker image built: kaggle-data-api:latest

📋 Image info:
kaggle-data-api     latest      2511461c9178   2 seconds ago   159MB

✨ Bundle complete: kaggle-data-api
```

## Build Outputs

### Esbuild Output

- **Location**: `dist/services/<service-name>/`
- **Files**:
  - `main.js` - Bundled and minified application code
  - `package.json` - Auto-generated dependencies manifest
  - `pnpm-lock.yaml` - Dependency lockfile (if configured)
  - `src/assets/` - Static assets (if present)

### Docker Image

- **Tag**: `<service-name>:latest`
- **Size**: Optimized multi-stage build (~150-200MB typically)
- **Features**:
  - Alpine Linux base for minimal size
  - Non-root user (fastify:1001) for security
  - Health check endpoint support
  - Production-optimized

## Configuration

### Per-Service Configuration

Each service has bundle configuration in `project.json`:

```json
{
  "bundle": {
    "executor": "@nx/esbuild:esbuild",
    "options": {
      "bundle": true,
      "esbuildOptions": {
        "minify": true
      }
    }
  },
  "docker": {
    "executor": "nx:run-commands",
    "dependsOn": ["bundle"]
  }
}
```

### Customizing the Bundle Script

Edit `scripts/bundle-docker.sh` to customize:

- Docker image naming convention
- Build arguments
- Post-build hooks

## Docker Image Usage

### Run Bundled Service Locally

```bash
docker run -p 3000:3000 -e NODE_ENV=production kaggle-data-api:latest
```

### Push to Registry

```bash
# Tag for registry
docker tag kaggle-data-api:latest myregistry.azurecr.io/kaggle-data-api:1.0.0

# Push
docker push myregistry.azurecr.io/kaggle-data-api:1.0.0
```

### Use in Docker Compose

```yaml
services:
  api:
    image: kaggle-data-api:latest
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://...
```

## Dockerfile Best Practices

Our Dockerfile follows these patterns:

1. **Multi-Stage Build**
   - Builder stage: Installs dependencies and compiles
   - Runtime stage: Contains only built artifacts and runtime

2. **Security**
   - Non-root user (fastify:1001)
   - Minimal base image (alpine)
   - No build tools in runtime image

3. **Performance**
   - Layer caching for dependency installation
   - .dockerignore to exclude unnecessary files
   - Minified bundled code

4. **Monitoring**
   - Health check endpoint at `/health`
   - Proper signal handling for graceful shutdown

## Troubleshooting

### Docker Build Fails

**Issue**: Nx cache errors during build
**Solution**: Dockerfile includes `pnpm nx reset` and `--skip-nx-cache` flags

**Issue**: Image size is too large
**Solution**: Ensure bundle is using `minify: true` and esbuild bundling is enabled

### Bundle Command Not Found

**Issue**: `just bundle` command fails
**Solution**: Ensure `scripts/bundle-docker.sh` is executable:

```bash
chmod +x scripts/bundle-docker.sh
```

### Docker Image Push Fails

**Issue**: Registry authentication error
**Solution**: Authenticate with your registry first:

```bash
docker login myregistry.azurecr.io
```

## Performance Optimization

### Reduce Image Size

1. **Minification**: Enabled by default in bundle target
2. **Alpine Base**: Using node:22-alpine (~150MB base)
3. **Single-Layer Runtime**: Copy only built artifacts

### Faster Builds

1. **Leverage Docker Layer Caching**: Don't change package.json often
2. **Parallel Builds**: Bundle multiple services:
   ```bash
   just bundle-all
   ```
3. **Skip Tests**: Bundle only, no test verification
   ```bash
   pnpm nx bundle kaggle-data-api --skip-nx-cache
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Bundle and Push Image
  run: |
    just bundle kaggle-data-api
    docker tag kaggle-data-api:latest ${{ env.REGISTRY }}/kaggle-data-api:${{ github.sha }}
    docker push ${{ env.REGISTRY }}/kaggle-data-api:${{ github.sha }}
```

## References

- [Nx Esbuild Documentation](https://nx.dev/packages/esbuild)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Alpine Linux Images](https://hub.docker.com/_/alpine)
- [Container Security Best Practices](https://docs.docker.com/engine/security/)
