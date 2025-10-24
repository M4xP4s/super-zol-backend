import { describe, it, expect, vi, beforeEach } from 'vitest';

type MockedFn = ReturnType<typeof vi.fn>;

vi.mock('execa', () => ({ execa: vi.fn() }));

describe('verifyKaggleAPI', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return true when API call succeeds', async () => {
    const ex = await import('execa');
    (ex.execa as unknown as MockedFn).mockResolvedValue({ exitCode: 0 } as unknown as {
      exitCode: number;
    });
    const { verifyKaggleAPI } = await import('../../../src/lib/auth/verify-api');
    await expect(verifyKaggleAPI()).resolves.toBe(true);
  });

  it('should return false when API call fails', async () => {
    const ex = await import('execa');
    (ex.execa as unknown as MockedFn).mockRejectedValue(new Error('fail'));
    const { verifyKaggleAPI } = await import('../../../src/lib/auth/verify-api');
    await expect(verifyKaggleAPI()).resolves.toBe(false);
  });

  it('should handle timeout gracefully', async () => {
    const ex = await import('execa');
    const err = new Error('ETIMEDOUT') as Error & { timedOut?: boolean };
    err.timedOut = true;
    (ex.execa as unknown as MockedFn).mockRejectedValue(err);
    const { verifyKaggleAPI } = await import('../../../src/lib/auth/verify-api');
    await expect(verifyKaggleAPI(1)).resolves.toBe(false);
  });

  it('should handle missing kaggle CLI', async () => {
    const ex = await import('execa');
    const err = new Error('ENOENT') as Error & { code?: string };
    err.code = 'ENOENT';
    (ex.execa as unknown as MockedFn).mockRejectedValue(err);
    const { verifyKaggleAPI } = await import('../../../src/lib/auth/verify-api');
    await expect(verifyKaggleAPI()).resolves.toBe(false);
  });
});
