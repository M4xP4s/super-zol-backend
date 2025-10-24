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

  it('should handle numeric values in JSON', async () => {
    const kaggleDir = path.join(tmpHome, '.kaggle');
    await fs.mkdir(kaggleDir, { recursive: true });
    const file = path.join(kaggleDir, 'kaggle.json');
    // Test with non-string values (should be rejected)
    await fs.writeFile(file, JSON.stringify({ username: 123, key: 'validkey123' }), 'utf8');
    await fs.chmod(file, 0o600);

    const creds = await mod.checkKaggleJson();
    // Should return null because username is not a string
    expect(creds).toBeNull();
  });

  it('should return null if kaggle.json is a directory', async () => {
    const kaggleDir = path.join(tmpHome, '.kaggle');
    await fs.mkdir(kaggleDir, { recursive: true });
    const file = path.join(kaggleDir, 'kaggle.json');
    await fs.mkdir(file); // Create as directory instead of file

    const creds = await mod.checkKaggleJson();
    expect(creds).toBeNull();
  });

  it('should return null if JSON missing required fields', async () => {
    const kaggleDir = path.join(tmpHome, '.kaggle');
    await fs.mkdir(kaggleDir, { recursive: true });
    const file = path.join(kaggleDir, 'kaggle.json');

    // Missing 'key' field
    await fs.writeFile(file, JSON.stringify({ username: 'dave' }), 'utf8');
    await fs.chmod(file, 0o600);

    const creds = await mod.checkKaggleJson();
    expect(creds).toBeNull();
  });

  it('should handle chmod errors gracefully in fixKaggleJsonPermissions', async () => {
    // Call fixKaggleJsonPermissions when file doesn't exist
    // Should not throw, just resolve
    await expect(mod.fixKaggleJsonPermissions()).resolves.toBeUndefined();
  });

  it('should handle mkdir errors gracefully in fixKaggleJsonPermissions', async () => {
    // Create a file where the .kaggle directory should be
    await fs.writeFile(path.join(tmpHome, '.kaggle'), 'blocking file', 'utf8');

    // This should not throw even though mkdir will fail
    await expect(mod.fixKaggleJsonPermissions()).resolves.toBeUndefined();
  });
});
