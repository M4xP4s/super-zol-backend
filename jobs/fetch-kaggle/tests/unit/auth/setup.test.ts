import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const saveHome = process.env.HOME;

// Hoisted answer queue for readline mock
const hoisted = vi.hoisted(() => ({ answers: [] as string[] }));
vi.mock('node:readline/promises', () => ({
  createInterface: () => ({
    question: async () => hoisted.answers.shift() ?? '',
    close: () => undefined,
  }),
}));

// Mock execa to prevent actual browser opening
vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}));

describe('interactive setup', () => {
  let tmpHome: string;

  beforeEach(async () => {
    vi.resetModules();
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'fk-auth-home-'));
    process.env.HOME = tmpHome;
    // Ensure Downloads exists
    await fs.mkdir(path.join(tmpHome, 'Downloads'), { recursive: true });
  });

  afterEach(async () => {
    process.env.HOME = saveHome;
    try {
      await fs.rm(tmpHome, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('should find kaggle.json in Downloads and copy it', async () => {
    const src = path.join(tmpHome, 'Downloads', 'kaggle.json');
    await fs.writeFile(src, JSON.stringify({ username: 'dana', key: 'k'.repeat(35) }), 'utf8');

    // Answer 'n' for removal prompt
    hoisted.answers.push('n');

    const setup = await import('../../../src/lib/auth/setup');
    const config = await import('../../../src/infrastructure/config');
    const ok = await setup.setupKaggleJson();
    expect(ok).toBe(true);
    // File copied
    const target = config.KAGGLE_PATHS.kaggleJson;
    const stat = await fs.stat(target);
    expect(stat.isFile()).toBe(true);
  });

  it('should prompt for custom path when not in Downloads', async () => {
    const custom = path.join(tmpHome, 'custom-creds.json');
    await fs.writeFile(custom, JSON.stringify({ username: 'eve', key: 'z'.repeat(50) }), 'utf8');

    // First question: custom path
    hoisted.answers.push(custom);

    const setup = await import('../../../src/lib/auth/setup');
    const config = await import('../../../src/infrastructure/config');
    const ok = await setup.setupKaggleJson();
    expect(ok).toBe(true);
    const stat = await fs.stat(config.KAGGLE_PATHS.kaggleJson);
    expect(stat.isFile()).toBe(true);
  });

  it('should open browser when user presses Enter with no path', async () => {
    // Mock open to avoid real browser
    vi.mock('open', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
    // user presses Enter (empty answer)
    hoisted.answers.push('');

    const setup = await import('../../../src/lib/auth/setup');
    const ok = await setup.setupKaggleJson();
    expect(ok).toBe(false);
  });

  it('should remove source from Downloads when user confirms', async () => {
    const src = path.join(tmpHome, 'Downloads', 'kaggle.json');
    await fs.writeFile(src, JSON.stringify({ username: 'fran', key: 'm'.repeat(35) }), 'utf8');

    // Answer 'y' to removal prompt
    hoisted.answers.push('y');

    const setup = await import('../../../src/lib/auth/setup');
    const ok = await setup.setupKaggleJson();
    expect(ok).toBe(true);
    await expect(fs.stat(src)).rejects.toThrow();
  });

  it('should return false when custom path is not a file', async () => {
    const notAFile = path.join(tmpHome, 'not-a-file-but-a-dir');
    await fs.mkdir(notAFile, { recursive: true });

    // User provides directory path instead of file
    hoisted.answers.push(notAFile);

    const setup = await import('../../../src/lib/auth/setup');
    const ok = await setup.setupKaggleJson();
    expect(ok).toBe(false);
  });

  it('should return false when custom path does not exist', async () => {
    const nonExistent = path.join(tmpHome, 'does-not-exist.json');

    // User provides non-existent path
    hoisted.answers.push(nonExistent);

    const setup = await import('../../../src/lib/auth/setup');
    const ok = await setup.setupKaggleJson();
    expect(ok).toBe(false);
  });

  it('should handle readline errors gracefully during removal prompt', async () => {
    const src = path.join(tmpHome, 'Downloads', 'kaggle.json');
    await fs.writeFile(src, JSON.stringify({ username: 'grace', key: 'q'.repeat(40) }), 'utf8');

    // Simulate readline error by making the answer undefined (simulates closed stdin)
    hoisted.answers.push(undefined as unknown as string);

    const setup = await import('../../../src/lib/auth/setup');
    const ok = await setup.setupKaggleJson();
    // Should still succeed (error is caught and ignored)
    expect(ok).toBe(true);
    // Original file should still exist (removal failed silently)
    await expect(fs.stat(src)).resolves.toBeTruthy();
  });

  it('should test openBrowserToKaggle on different platforms', async () => {
    const setup = await import('../../../src/lib/auth/setup');

    // Save original platform
    const originalPlatform = process.platform;

    try {
      // Test darwin (already covered in main tests, but explicit)
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      await expect(setup.openBrowserToKaggle()).resolves.toBeUndefined();

      // Test win32
      Object.defineProperty(process, 'platform', { value: 'win32' });
      await expect(setup.openBrowserToKaggle()).resolves.toBeUndefined();

      // Test linux
      Object.defineProperty(process, 'platform', { value: 'linux' });
      await expect(setup.openBrowserToKaggle()).resolves.toBeUndefined();
    } finally {
      // Restore original platform
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    }
  });

  it('should handle unlink failure silently during cleanup', async () => {
    const src = path.join(tmpHome, 'Downloads', 'kaggle.json');
    await fs.writeFile(src, JSON.stringify({ username: 'hal', key: 'h'.repeat(40) }), 'utf8');

    // Make the file read-only to cause unlink to potentially fail
    await fs.chmod(src, 0o444);

    // Answer 'yes' to removal
    hoisted.answers.push('yes');

    const setup = await import('../../../src/lib/auth/setup');
    const ok = await setup.setupKaggleJson();

    // Should still succeed even if unlink has issues
    expect(ok).toBe(true);
  });
});
