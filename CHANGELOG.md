# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]

### Added

- `just pack-for-llm` command and `scripts/pack-for-llm.sh` to create a tar.gz of the repo excluding `.gitignore`d files for easy LLM context sharing.
- **fetch-kaggle job** (Phase 0 & 1 complete): Hexagonal Architecture implementation for Kaggle dataset operations
  - Created complete Hexagonal Architecture structure (core/domain/ports/adapters)
  - Implemented domain entities (manifest, profile, inventory) and value objects (KaggleCredentials)
  - Added Zod schemas for runtime validation in infrastructure layer
  - Created Auth service with 6 passing TDD tests demonstrating architecture
  - Configured Vitest for testing (90% coverage threshold)
  - Added dependencies: zod, execa, csv-parse, date-fns, chalk, commander
  - Comprehensive README documenting Hexagonal Architecture patterns
- **fetch-kaggle job – Phase 2 (Utilities, TDD) complete**
  - Implemented utility modules: `console.ts`, `fs.ts`, `hash.ts`, `csv.ts`
  - Added unit tests: `console.test.ts`, `fs.test.ts`, `hash.test.ts`, `csv.test.ts`
  - Achieved ≥90% coverage for utils with Vitest v8 coverage provider
  - Added dev dependency `@vitest/coverage-v8` and scoped coverage include to `src/lib/utils/**`
- CHANGELOG maintenance guidance in `CLAUDE.md` and `AGENTS.md`.
- TODO.md maintenance guidance alongside CHANGELOG.md in `CLAUDE.md`
- Reference to `ARCHITECTURE.md` in `AGENTS.md`.
- Kaggle environment variable placeholders (`KAGGLE_USERNAME`, `KAGGLE_KEY`) in `.env.example`.

### Changed

- **Removed all Jest references** from monorepo (switched to Vitest consistently)
- Updated `nx.json` to reference `vitest.config` instead of `jest.config`
- Removed Jest packages: @nx/jest, @types/jest, jest, jest-environment-node, ts-jest

### Security

- Ensured real secrets remain local: `.env` is gitignored; no secrets are committed.

<!--
Release template (example):

## [0.1.0] - 2025-10-24
### Added
- ...

### Changed
- ...

### Fixed
- ...

### Security
- ...

Link references (add when tagging releases):
[Unreleased]: https://github.com/<org>/<repo>/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/<org>/<repo>/releases/tag/v0.1.0
-->
