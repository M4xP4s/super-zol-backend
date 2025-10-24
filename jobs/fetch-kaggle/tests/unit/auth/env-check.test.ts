import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('checkEnvVars', () => {
  let mod: typeof import('../../../src/lib/auth/env-check');
  const restore: Record<string, string | undefined> = {};

  beforeEach(async () => {
    // stash originals
    restore.KAGGLE_USERNAME = process.env.KAGGLE_USERNAME;
    restore.KAGGLE_KEY = process.env.KAGGLE_KEY;

    // fresh import for each test
    mod = await import('../../../src/lib/auth/env-check');
  });

  afterEach(() => {
    if (restore.KAGGLE_USERNAME !== undefined)
      process.env.KAGGLE_USERNAME = restore.KAGGLE_USERNAME;
    else delete process.env.KAGGLE_USERNAME;
    if (restore.KAGGLE_KEY !== undefined) process.env.KAGGLE_KEY = restore.KAGGLE_KEY;
    else delete process.env.KAGGLE_KEY;
  });

  it('should return truthy when credentials set', () => {
    process.env.KAGGLE_USERNAME = 'test-user';
    process.env.KAGGLE_KEY = 'test-key-12345678901234567890';
    const res = mod.checkEnvVars();
    expect(res).toBeTruthy();
    expect(res?.username).toBe('test-user');
    expect(res?.key).toBe('test-key-12345678901234567890');
  });

  it('should return null when username missing', () => {
    delete process.env.KAGGLE_USERNAME;
    process.env.KAGGLE_KEY = 'x'.repeat(30);
    const res = mod.checkEnvVars();
    expect(res).toBeNull();
  });

  it('should return null when key missing', () => {
    process.env.KAGGLE_USERNAME = 'user';
    delete process.env.KAGGLE_KEY;
    const res = mod.checkEnvVars();
    expect(res).toBeNull();
  });
});
