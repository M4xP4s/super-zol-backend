#!/usr/bin/env bash
set -euo pipefail

NAME="$1"

echo "⚙️  Generating job: $NAME"

# Generate base structure with Nx
pnpm nx g @nx/node:application "jobs/$NAME" \
  --framework=none \
  --bundler=esbuild \
  --unitTestRunner=none \
  --e2eTestRunner=none \
  --projectNameAndRootFormat=as-provided

# Create tests directory
mkdir -p "jobs/$NAME/tests"

# Create test file
cat > "jobs/$NAME/tests/$NAME.test.ts" << 'EOF'
import { describe, it, expect } from 'vitest';

describe('Job', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });

  it('should execute successfully', async () => {
    const result = await executeJob();
    expect(result.status).toBe('success');
  });
});

// Example job function - replace with your actual implementation
async function executeJob(): Promise<{ status: string }> {
  return { status: 'success' };
}
EOF

# Create vitest config
cat > "jobs/$NAME/vitest.config.ts" << 'EOF'
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
if [ -f "jobs/$NAME/project.json" ]; then
  node -e "
    const fs = require('fs');
    const path = 'jobs/$NAME/project.json';
    const project = JSON.parse(fs.readFileSync(path, 'utf8'));
    project.targets = project.targets || {};
    if (!project.targets.test) {
      project.targets.test = {
        executor: '@nx/vite:test',
        outputs: ['{projectRoot}/coverage'],
        options: {
          config: 'jobs/$NAME/vitest.config.ts',
          passWithNoTests: true
        }
      };
      fs.writeFileSync(path, JSON.stringify(project, null, 2) + '\n');
    }
  "
fi

echo "✅ Job $NAME created with complete structure"
echo ""
echo "📁 Structure:"
echo "   jobs/$NAME/"
echo "   ├── src/           # Source code"
echo "   ├── tests/         # Test files"
echo "   ├── project.json   # Nx config"
echo "   └── vitest.config.ts"
echo ""
echo "🚀 Next steps:"
echo "   pnpm nx test $NAME      # Run tests"
echo "   pnpm nx build $NAME     # Build job"
