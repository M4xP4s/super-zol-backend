import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/lib/download/fetch', () => ({
  downloadDataset: vi.fn(async () => false),
}));

import { runDownload } from '../../../src/lib/download/index.js';
import { downloadDataset } from '../../../src/lib/download/fetch.js';

describe('runDownload (unit)', () => {
  it('should return 1 when non-dry-run download fails', async () => {
    (downloadDataset as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
    const code = await runDownload({ datasetId: 'user/dataset', dryRun: false });
    expect(code).toBe(1);
  });
});
