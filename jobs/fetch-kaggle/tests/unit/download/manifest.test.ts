import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { createManifest } from '../../../src/lib/download/manifest';
import { DownloadManifestSchema } from '../../../src/infrastructure/zod-schemas';

describe('createManifest', () => {
  it('should create valid manifest JSON at expected path', async () => {
    const tmp = path.join(process.cwd(), 'jobs/fetch-kaggle/data/tests/tmp-manifest');
    await fs.rm(tmp, { recursive: true, force: true });
    await fs.mkdir(tmp, { recursive: true });

    const filesData = {
      totalFiles: 1,
      totalSizeMB: 0.001,
      totalRows: 10,
      files: [
        {
          filename: 'test.csv',
          path: path.join(tmp, 'test.csv'),
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'a'.repeat(64),
          row_count: 10,
        },
      ],
    };
    const downloadTime = new Date().toISOString();
    const datasetId = 'user/dataset';

    const manifestPath = await createManifest(tmp, filesData, downloadTime, datasetId);
    expect(manifestPath).toBe(path.join(tmp, 'download_manifest.json'));
    const raw = await fs.readFile(manifestPath, 'utf8');
    const json = JSON.parse(raw);
    const parsed = DownloadManifestSchema.safeParse(json);
    expect(parsed.success).toBe(true);
  });

  it('should use datasetId as name when no slash present', async () => {
    const tmp = path.join(process.cwd(), 'jobs/fetch-kaggle/data/tests/tmp-manifest2');
    await fs.rm(tmp, { recursive: true, force: true });
    await fs.mkdir(tmp, { recursive: true });
    const filesData = { totalFiles: 0, totalSizeMB: 0, totalRows: 0, files: [] };
    const manifestPath = await createManifest(
      tmp,
      filesData,
      new Date().toISOString(),
      'datasetonly'
    );
    const json = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    expect(json.dataset.kaggle_id).toBe('datasetonly');
  });
});
