import { describe, it, expect, vi, beforeEach } from 'vitest';

type MockedFn = ReturnType<typeof vi.fn>;

// Create mocks for modules the orchestrator depends on
vi.mock('../../../src/lib/auth/env-check', () => ({ checkEnvVars: vi.fn() }));
vi.mock('../../../src/lib/auth/kaggle-json', () => ({ checkKaggleJson: vi.fn() }));
vi.mock('../../../src/lib/auth/verify-api', () => ({ verifyKaggleAPI: vi.fn() }));
vi.mock('../../../src/lib/auth/setup', () => ({ setupKaggleJson: vi.fn() }));

describe('ensureKaggleAuth orchestrator', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns true when env creds present and verify succeeds', async () => {
    const env = await import('../../../src/lib/auth/env-check');
    const file = await import('../../../src/lib/auth/kaggle-json');
    const api = await import('../../../src/lib/auth/verify-api');
    const setup = await import('../../../src/lib/auth/setup');

    (env.checkEnvVars as unknown as MockedFn).mockReturnValue({
      username: 'u',
      key: 'k'.repeat(30),
    });
    (file.checkKaggleJson as unknown as MockedFn).mockResolvedValue(null);
    (api.verifyKaggleAPI as unknown as MockedFn).mockResolvedValue(true);
    (setup.setupKaggleJson as unknown as MockedFn).mockResolvedValue(false);

    const { ensureKaggleAuth } = await import('../../../src/lib/auth/index');
    await expect(ensureKaggleAuth()).resolves.toBe(true);
  });

  it('falls back to kaggle.json when env missing', async () => {
    const env = await import('../../../src/lib/auth/env-check');
    const file = await import('../../../src/lib/auth/kaggle-json');
    const api = await import('../../../src/lib/auth/verify-api');
    const setup = await import('../../../src/lib/auth/setup');

    (env.checkEnvVars as unknown as MockedFn).mockReturnValue(null);
    (file.checkKaggleJson as unknown as MockedFn).mockResolvedValue({
      username: 'f',
      key: 'x'.repeat(40),
    });
    (api.verifyKaggleAPI as unknown as MockedFn).mockResolvedValue(true);
    (setup.setupKaggleJson as unknown as MockedFn).mockResolvedValue(false);

    const { ensureKaggleAuth } = await import('../../../src/lib/auth/index');
    await expect(ensureKaggleAuth()).resolves.toBe(true);
  });

  it('runs setup when neither env nor file works', async () => {
    const env = await import('../../../src/lib/auth/env-check');
    const file = await import('../../../src/lib/auth/kaggle-json');
    const api = await import('../../../src/lib/auth/verify-api');
    const setup = await import('../../../src/lib/auth/setup');

    (env.checkEnvVars as unknown as MockedFn).mockReturnValue(null);
    (file.checkKaggleJson as unknown as MockedFn).mockResolvedValue(null);
    (api.verifyKaggleAPI as unknown as MockedFn).mockResolvedValueOnce(true);
    (setup.setupKaggleJson as unknown as MockedFn).mockResolvedValue(true);

    const { ensureKaggleAuth } = await import('../../../src/lib/auth/index');
    await expect(ensureKaggleAuth()).resolves.toBe(true);
    expect(setup.setupKaggleJson).toHaveBeenCalledTimes(1);
  });

  it('returns false when setup fails', async () => {
    const env = await import('../../../src/lib/auth/env-check');
    const file = await import('../../../src/lib/auth/kaggle-json');
    const api = await import('../../../src/lib/auth/verify-api');
    const setup = await import('../../../src/lib/auth/setup');

    (env.checkEnvVars as unknown as MockedFn).mockReturnValue(null);
    (file.checkKaggleJson as unknown as MockedFn).mockResolvedValue(null);
    (api.verifyKaggleAPI as unknown as MockedFn).mockResolvedValue(false);
    (setup.setupKaggleJson as unknown as MockedFn).mockResolvedValue(false); // setup fails

    const { ensureKaggleAuth } = await import('../../../src/lib/auth/index');
    await expect(ensureKaggleAuth()).resolves.toBe(false);
    expect(setup.setupKaggleJson).toHaveBeenCalledTimes(1);
  });

  it('returns false when setup succeeds but verify fails', async () => {
    const env = await import('../../../src/lib/auth/env-check');
    const file = await import('../../../src/lib/auth/kaggle-json');
    const api = await import('../../../src/lib/auth/verify-api');
    const setup = await import('../../../src/lib/auth/setup');

    (env.checkEnvVars as unknown as MockedFn).mockReturnValue(null);
    (file.checkKaggleJson as unknown as MockedFn).mockResolvedValue(null);
    (setup.setupKaggleJson as unknown as MockedFn).mockResolvedValue(true); // setup succeeds
    (api.verifyKaggleAPI as unknown as MockedFn).mockResolvedValue(false); // but verify fails

    const { ensureKaggleAuth } = await import('../../../src/lib/auth/index');
    await expect(ensureKaggleAuth()).resolves.toBe(false);
  });
});
