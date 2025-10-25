#!/usr/bin/env bash
set -euo pipefail

NAME="$1"

echo "🚀 Generating service: $NAME"

# Generate base structure with Nx
pnpm nx g @nx/node:application "services/$NAME" \
  --framework=fastify \
  --bundler=esbuild \
  --unitTestRunner=none \
  --e2eTestRunner=none \
  --projectNameAndRootFormat=as-provided

# Create tests directory
mkdir -p "services/$NAME/tests"

# Create test file
cat > "services/$NAME/tests/$NAME.test.ts" << 'EOF'
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../src/app/app';
import { FastifyInstance } from 'fastify';

describe('Service', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 on root endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });
    expect(response.statusCode).toBe(200);
  });
});
EOF

# Create vitest config
cat > "services/$NAME/vitest.config.ts" << 'EOF'
import { defineConfig } from 'vitest/config';
import baseConfig from '../../vitest.config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['tests/**/*.{test,spec}.{js,ts}', 'src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      ...baseConfig.test?.coverage,
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
    },
  },
});
EOF

# Add test target to project.json if missing
if [ -f "services/$NAME/project.json" ]; then
  node -e "
    const fs = require('fs');
    const path = 'services/$NAME/project.json';
    const project = JSON.parse(fs.readFileSync(path, 'utf8'));
    project.targets = project.targets || {};
    if (!project.targets.test) {
      project.targets.test = {
        executor: '@nx/vite:test',
        outputs: ['{projectRoot}/coverage'],
        options: {
          config: 'services/$NAME/vitest.config.ts',
          passWithNoTests: true
        }
      };
      fs.writeFileSync(path, JSON.stringify(project, null, 2) + '\n');
    }
  "
fi

echo "✅ Service $NAME created with complete structure"
echo ""
echo "📁 Structure:"
echo "   services/$NAME/"
echo "   ├── src/           # Source code"
echo "   ├── tests/         # Test files"
echo "   ├── project.json   # Nx config"
echo "   └── vitest.config.ts"
echo ""
echo "🚀 Next steps:"
echo "   pnpm nx test $NAME      # Run tests"
echo "   pnpm nx serve $NAME     # Start service"
echo "   pnpm nx build $NAME     # Build service"
