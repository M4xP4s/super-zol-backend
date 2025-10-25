# ESM Conversion Plan

## Executive Summary

Convert the entire TypeScript monorepo from CommonJS output to native ECMAScript Modules (ESM) to align with modern JavaScript ecosystem standards and enable better tree-shaking, smaller bundles, and compatibility with ESM-only packages.

## Current State Analysis

### ✅ Already ESM-Compatible

- **TypeScript source code**: Already uses ES6 `import/export` syntax
- **tsconfig.base.json**: Already set to `"module": "ES2022"`
- **Vitest configs**: Written in TypeScript, already ESM-compatible
- **Dependencies**: Modern packages (chalk@5, execa@9) are ESM-only, confirming need for ESM
- **Node.js version**: 22+ has excellent ESM support

### ❌ Currently CommonJS

- **Build output**: esbuild configured with `"format": ["cjs"]` in all project.json files
- **package.json**: Missing `"type": "module"` declaration
- **ESLint configs**: Most use `.js` extension with `require()` (though `.mjs` versions exist)
- **Import paths**: Missing `.js` extensions required by ESM spec
- **`__dirname` usage**: CommonJS global not available in ESM (app.ts:17, 24)

## Conversion Strategy

### Phase 1: Configuration Updates

#### 1.1 Root package.json

**Action**: Add `"type": "module"` to declare the entire package as ESM.

**File**: `package.json`

```json
{
  "name": "super-zol-backend",
  "version": "0.1.0",
  "type": "module",  // ← ADD THIS
  ...
}
```

**Impact**: Node.js will now treat all `.js` files as ESM by default.

#### 1.2 ESLint Configuration

**Action**: Remove all `.js` ESLint config files, keep only `.mjs` versions.

**Files to update**:

- ✅ `eslint.config.js` → DELETE (keep `eslint.config.mjs`)
- `services/api-gateway/eslint.config.js` → Convert to `.mjs`
- `services/worker/eslint.config.js` → Convert to `.mjs`
- `libs/shared-util/eslint.config.js` → Convert to `.mjs`
- `jobs/fetch-kaggle/eslint.config.js` → Convert to `.mjs`

**Rationale**: ESM cannot use `require()`. ESLint supports `.mjs` natively.

#### 1.3 Build Configuration (project.json)

**Action**: Change esbuild format from `"cjs"` to `"esm"` in all applications.

**Files to update**:

- `services/api-gateway/project.json`
- `services/worker/project.json`
- `jobs/fetch-kaggle/project.json`

**Change**:

```json
{
  "build": {
    "options": {
      "format": ["esm"],  // ← Change from "cjs"
      ...
    }
  }
}
```

**Note**: Libraries use `@nx/js:tsc` which respects tsconfig module setting (already ES2022).

#### 1.4 TypeScript Configuration

**Action**: Verify tsconfig settings for optimal ESM output.

**File**: `tsconfig.base.json` (already correct)

```json
{
  "compilerOptions": {
    "module": "ES2022",           // ✅ Already set
    "moduleResolution": "node",   // ✅ OK for now (Node16/NodeNext also work)
    "target": "ES2022",           // ✅ Already set
    ...
  }
}
```

**Optional Enhancement**: Change `"moduleResolution": "node"` to `"moduleResolution": "node16"` or `"nodenext"` for stricter ESM checking (requires `.js` extensions in imports).

### Phase 2: Source Code Updates

#### 2.1 Add `.js` Extensions to Relative Imports

**Action**: Update all relative imports to include `.js` extension (TypeScript ESM requirement).

**Pattern to find**:

```bash
grep -r "from '\\./" services/ libs/ jobs/ --include="*.ts"
grep -r 'from "\\./' services/ libs/ jobs/ --include="*.ts"
```

**Example changes**:

```typescript
// BEFORE (CommonJS-style)
import { app } from './app/app';
import { something } from './lib/utils';

// AFTER (ESM-style)
import { app } from './app/app.js';
import { something } from './lib/utils.js';
```

**Files affected** (preliminary scan):

- `services/api-gateway/src/main.ts` (line 2)
- `services/api-gateway/src/app/app.ts` (lines 39, 43)
- Similar patterns in all services/libs/jobs

**Why**: ESM spec requires explicit file extensions. TypeScript will emit `.js` files, so imports must reference `.js` even though source is `.ts`.

#### 2.2 Replace `__dirname` with `import.meta.url`

**Action**: Convert CommonJS `__dirname` to ESM `import.meta.url` pattern.

**Files affected**:

- `services/api-gateway/src/app/app.ts` (lines 17, 24)
- Any other files using `__dirname` or `__filename`

**Conversion pattern**:

```typescript
// BEFORE (CommonJS)
import * as path from 'path';
fastify.register(AutoLoad, {
  dir: path.join(__dirname, 'plugins'),
});

// AFTER (ESM)
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

fastify.register(AutoLoad, {
  dir: path.join(__dirname, 'plugins'),
});
```

**Alternative (cleaner)**:

```typescript
// AFTER (ESM - cleaner)
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

fastify.register(AutoLoad, {
  dir: join(__dirname, 'plugins'),
});
```

### Phase 3: Verification & Testing

#### 3.1 Type Checking

```bash
pnpm exec tsc --noEmit
```

**Expected**: No type errors. TypeScript should handle ESM correctly with current config.

#### 3.2 Linting

```bash
just lint
# or
pnpm nx run-many -t lint
```

**Expected**: ESLint should work with `.mjs` configs.

#### 3.3 Build All Projects

```bash
just build
# or
pnpm nx run-many -t build
```

**Expected**:

- All builds succeed
- Output files in `dist/` have ESM format
- Generated `package.json` files include `"type": "module"`

**Verify output**:

```bash
# Check generated package.json has type: module
cat dist/services/api-gateway/package.json | grep '"type"'

# Check output uses ESM syntax (export, import, not require)
head -20 dist/services/api-gateway/main.js
```

#### 3.4 Test Suite

```bash
just test
# or
pnpm nx run-many -t test
```

**Expected**: All tests pass with 90%+ coverage (same as before).

**Critical tests**:

- Fastify AutoLoad functionality (relies on file imports)
- Dynamic imports in test utilities
- Any file path manipulation

#### 3.5 Runtime Verification

```bash
# Start services
just serve-api
just serve-worker

# Verify they start without errors
```

**Potential issues to watch**:

- AutoLoad plugin discovery (should work with ESM)
- Path resolution in plugins/routes
- Environment variable loading

### Phase 4: Documentation & Cleanup

#### 4.1 Update CLAUDE.md

**Action**: Add note about ESM usage in "Key Principles" section.

```markdown
7. **Pure ESM**: Project uses native ECMAScript Modules with `type: module`
   - All imports use `.js` extensions (even for `.ts` sources)
   - Use `import.meta.url` instead of `__dirname`
   - No `require()` or `module.exports` in source code
```

#### 4.2 Update ARCHITECTURE.md (if exists)

**Action**: Document ESM architecture decisions and patterns.

#### 4.3 Clean up legacy files

**Action**: Remove all `.js` ESLint config files after confirming `.mjs` versions work.

```bash
rm eslint.config.js
rm services/*/eslint.config.js
rm libs/*/eslint.config.js
rm jobs/*/eslint.config.js
```

## Risk Assessment & Mitigation

### Low Risk ✅

- **TypeScript already uses ESM syntax**: Source code changes are minimal
- **Modern Node.js (22+)**: Excellent ESM support, no polyfills needed
- **Vitest native ESM support**: Test framework handles ESM natively
- **Nx ESM support**: Nx 19.8 fully supports ESM builds

### Medium Risk ⚠️

- **Fastify AutoLoad with ESM**: Fastify 4.x supports ESM, but AutoLoad behavior may differ
  - **Mitigation**: Thorough testing of plugin/route discovery
  - **Fallback**: Manual registration (already implemented in `build()` function)

- **Import path resolution**: Missing `.js` extensions will cause runtime errors
  - **Mitigation**: Systematic grep + replace with verification
  - **Tool**: Consider using `eslint-plugin-import` with `extensions` rule

### Minimal Risk 🟢

- **Dependencies**: All modern deps support ESM (chalk, execa are ESM-only)
- **Git hooks**: Pure bash scripts, unaffected by module system
- **Docker**: Node.js runtime handles ESM transparently

## Rollback Plan

If critical issues arise:

1. **Revert git commits**: `git reset --hard HEAD~N` (before pushing)
2. **Specific revert points**:
   - After Phase 1: Revert config changes only
   - After Phase 2: Revert source code changes
   - After tests fail: Investigate specific failures before reverting

3. **Atomic commits**: Each phase should be a separate commit for easy rollback

## Success Criteria

- ✅ All `project.json` files use `"format": ["esm"]`
- ✅ Root `package.json` has `"type": "module"`
- ✅ All relative imports include `.js` extensions
- ✅ No `__dirname` or `__filename` usage (replaced with `import.meta.url`)
- ✅ All ESLint configs are `.mjs` format
- ✅ TypeScript compilation succeeds (`tsc --noEmit`)
- ✅ All tests pass with ≥90% coverage
- ✅ All builds succeed with ESM output
- ✅ Services start and run without errors
- ✅ No breaking changes to public APIs

## Timeline Estimate

- **Phase 1** (Config): ~15 minutes
- **Phase 2** (Source): ~30 minutes (depending on import count)
- **Phase 3** (Testing): ~20 minutes (test suite + manual verification)
- **Phase 4** (Docs): ~10 minutes

**Total**: ~75 minutes for complete conversion

## References

- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [TypeScript ESM Support](https://www.typescriptlang.org/docs/handbook/esm-node.html)
- [Nx ESM Support](https://nx.dev/recipes/tips-n-tricks/esm-modules)
- [Fastify ESM Guide](https://fastify.dev/docs/latest/Guides/Migration-Guide-V4/#esm-support)
- [Vitest ESM Support](https://vitest.dev/guide/common-errors.html#cannot-find-module)
