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

  // additional edge-case tests omitted for portability
});
