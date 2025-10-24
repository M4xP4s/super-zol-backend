<!--
Title must follow Conventional Commits: type(scope): subject
Types: feat, fix, docs, style, refactor, test, chore, ci, build, perf
Examples: feat(api): add auth endpoint • fix(worker): handle retry backoff
-->

## Problem Statement

- What problem does this PR solve? Why now?

## Summary of Changes

- High-level summary of what changed (bullets are fine)

## Linked Issues

- Closes #<id> (optional)

## Tests + Coverage

- What tests were added/updated? Any areas intentionally left untested?
- Coverage expectations met for changed projects?

## Docs Updates

- What docs changed? README, API docs, comments, or ADRs?

## API Changes (if applicable)

- Request example:

```http
GET /api/v1/example
```

- Response example:

```json
{ "ok": true }
```

## Breaking Changes

- Any breaking behavior? Migration steps?

## Checklist

- [ ] Title uses Conventional Commits format
- [ ] `pnpm nx affected -t lint,test,build` passes
- [ ] Types pass (`pnpm exec tsc --noEmit`)
- [ ] Docs updated (if needed)
