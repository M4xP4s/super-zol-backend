#!/usr/bin/env bash
set -euo pipefail

NAME="$1"

echo "📚 Generating library: $NAME"

# Generate base structure with Nx
pnpm nx g @nx/node:library "libs/$NAME" \
  --bundler=tsc \
  --unitTestRunner=none \
  --projectNameAndRootFormat=as-provided

# Create tests directory
mkdir -p "libs/$NAME/tests"

# Create test file with generic content (not trying to import specific function)
cat > "libs/$NAME/tests/$NAME.test.ts" << 'EOF'
import { describe, it, expect } from 'vitest';

describe('Library', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });

  it('should work correctly', () => {
    // Add your library tests here
    const result = 'test';
    expect(result).toBeDefined();
  });
});
EOF

# Create vitest config
cat > "libs/$NAME/vitest.config.ts" << 'EOF'
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

# Add test target to project.json
if [ -f "libs/$NAME/project.json" ]; then
  node -e "
    const fs = require('fs');
    const path = 'libs/$NAME/project.json';
    const project = JSON.parse(fs.readFileSync(path, 'utf8'));
    project.targets = project.targets || {};
    project.targets.test = {
      executor: '@nx/vite:test',
      outputs: ['{projectRoot}/coverage'],
      options: {
        config: 'libs/$NAME/vitest.config.ts',
        passWithNoTests: true
      }
    };
    if (!project.targets.build) {
      project.targets.build = {
        executor: '@nx/js:tsc',
        outputs: ['{options.outputPath}'],
        options: {
          outputPath: 'dist/libs/$NAME',
          main: 'libs/$NAME/src/index.ts',
          tsConfig: 'libs/$NAME/tsconfig.lib.json',
          assets: ['libs/$NAME/*.md']
        }
      };
    }
    fs.writeFileSync(path, JSON.stringify(project, null, 2) + '\n');
  "
fi

echo "✅ Library $NAME created with complete structure"
echo ""
echo "📁 Structure:"
echo "   libs/$NAME/"
echo "   ├── src/           # Source code"
echo "   ├── tests/         # Test files"
echo "   ├── project.json   # Nx config"
echo "   └── vitest.config.ts"
echo ""
echo "🚀 Next steps:"
echo "   pnpm nx test $NAME      # Run tests"
echo "   pnpm nx build $NAME     # Build library"
