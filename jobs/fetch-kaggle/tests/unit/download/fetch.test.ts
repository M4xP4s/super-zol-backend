import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock execa to avoid real kaggle CLI calls
vi.mock('execa', () => ({
  execa: vi.fn(async () => ({ stdout: '', stderr: '', exitCode: 0 })),
}));

import { execa } from 'execa';

import { downloadDataset } from '../../../src/lib/download/fetch.js';

describe('downloadDataset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call kaggle CLI with correct args and unzip', async () => {
    const targetDir = '/tmp/kaggle-test-download';
    const datasetId = 'user/dataset';
    await expect(downloadDataset(targetDir, datasetId, { timeout: 12345 })).resolves.toBe(true);
    expect(execa).toHaveBeenCalledWith(
      'kaggle',
      ['datasets', 'download', datasetId, '-p', targetDir, '--unzip'],
      expect.objectContaining({ timeout: 12345 })
    );
  });

  it('should handle download failures and return false', async () => {
    (execa as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('failed'));
    const ok = await downloadDataset('/tmp/dir', 'user/dataset');
    expect(ok).toBe(false);
  });
});
