#!/usr/bin/env node
import { execa } from 'execa';

// Filter out accidental watch flags forwarded by package manager (e.g., `-w`, `--w`, `--watch`)
const forwarded = process.argv.slice(2);
const filtered = forwarded.filter((arg) => {
  return !(
    arg === '-w' ||
    arg === '--w' ||
    arg.startsWith('--w=') ||
    arg === '--watch' ||
    arg.startsWith('--watch=')
  );
});

const run = async () => {
  try {
    // Force non-watch CI mode so tests exit deterministically
    const env = { ...process.env, CI: '1', VITEST_WATCH: 'false' };
    const args = ['nx', 'run-many', '-t', 'test'];
    // Forward non-watch flags directly to Nx (no '--' sentinel),
    // so options like --skip-nx-cache are parsed by Nx CLI.
    if (filtered.length) args.push(...filtered);

    const subprocess = execa('pnpm', args, {
      stdio: 'inherit',
      env,
    });
    const { exitCode } = await subprocess;
    process.exit(exitCode ?? 0);
  } catch (err) {
    if (err.exitCode) process.exit(err.exitCode);
    console.error(err);
    process.exit(1);
  }
};

run();
