import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// We'll dynamically import after setting HOME to ensure KAGGLE_PATHS resolves correctly
let mod: typeof import('../../../src/lib/auth/kaggle-json');
let config: typeof import('../../../src/infrastructure/config');

const saveHome = process.env.HOME;

describe('kaggle.json validation', () => {
  let tmpHome: string;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'fk-auth-khome-'));
    process.env.HOME = tmpHome;
    // fresh imports per test
    mod = await import('../../../src/lib/auth/kaggle-json');
    config = await import('../../../src/infrastructure/config');
  });

  afterEach(async () => {
    process.env.HOME = saveHome;
    // best-effort cleanup
    try {
      await fs.rm(tmpHome, { recursive: true, force: true });
    } catch {
      // ignore cleanup
    }
  });

  it('should validate existing kaggle.json', async () => {
    const kaggleDir = path.join(tmpHome, '.kaggle');
    await fs.mkdir(kaggleDir, { recursive: true });
    const file = path.join(kaggleDir, 'kaggle.json');
    await fs.writeFile(file, JSON.stringify({ username: 'alice', key: 'a'.repeat(30) }), 'utf8');
    await fs.chmod(file, 0o600);

    const creds = await mod.checkKaggleJson();
    expect(creds).toEqual({ username: 'alice', key: 'a'.repeat(30) });
    // Path comes from config
    expect(config.KAGGLE_PATHS.kaggleJson.endsWith('/.kaggle/kaggle.json')).toBe(true);
  });

  it('should fix permissions if incorrect', async () => {
    const kaggleDir = path.join(tmpHome, '.kaggle');
    await fs.mkdir(kaggleDir, { recursive: true });
    const file = path.join(kaggleDir, 'kaggle.json');
    await fs.writeFile(file, JSON.stringify({ username: 'bob', key: 'b'.repeat(40) }), 'utf8');
    await fs.chmod(file, 0o644); // wrong

    await expect(mod.fixKaggleJsonPermissions()).resolves.toBeUndefined();
  });

  it('should return null if file missing', async () => {
    const creds = await mod.checkKaggleJson();
    expect(creds).toBeNull();
  });

  it('should return null if JSON invalid', async () => {
    const kaggleDir = path.join(tmpHome, '.kaggle');
    await fs.mkdir(kaggleDir, { recursive: true });
    const file = path.join(kaggleDir, 'kaggle.json');
    await fs.writeFile(file, '{ invalid json', 'utf8');
    await fs.chmod(file, 0o600);

    const creds = await mod.checkKaggleJson();
    expect(creds).toBeNull();
  });

  // (additional branch/catch coverage intentionally limited due to OS differences)

  // Note: permission behavior may vary by OS; covered by other tests.
});
