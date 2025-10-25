import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { runDownload } from '../../src/lib/download';

describe('download flow (integration)', () => {
  it('should complete full flow in dry-run mode', async () => {
    const code = await runDownload({ datasetId: 'user/dataset', dryRun: true });
    expect([0, 2]).toContain(code); // 0 success, 2 if already present

    // Verify a manifest exists in the latest dated directory
    const root = path.join(process.cwd(), 'jobs/fetch-kaggle/data/kaggle_raw');
    const dirs = (await fs.readdir(root, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && /^\d{8}$/.test(d.name))
      .map((d) => d.name)
      .sort();
    const latest = dirs.pop();
    expect(latest).toBeTruthy();
    const manifestPath = path.join(root, latest as string, 'download_manifest.json');
    const exists = await fs
      .access(manifestPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it('should be idempotent in dry-run (second run finds sample file)', async () => {
    const first = await runDownload({ datasetId: 'user/dataset', dryRun: true });
    expect([0, 2]).toContain(first);
    const second = await runDownload({ datasetId: 'user/dataset', dryRun: true });
    expect([0, 2]).toContain(second);
  });
});
