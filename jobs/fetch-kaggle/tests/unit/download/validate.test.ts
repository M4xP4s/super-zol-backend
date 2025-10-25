import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { validateCompletion } from '../../../src/lib/download/validate.js';

describe('validateCompletion', () => {
  it('should pass when manifest exists and files have checksums', async () => {
    const dir = path.join(process.cwd(), 'jobs/fetch-kaggle/data/tests/tmp-validate');
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const manifest = {
      dataset: {
        name: 'Test',
        kaggle_id: 'user/dataset',
        url: 'https://kaggle.com/datasets/user/dataset',
        download_timestamp: new Date().toISOString(),
      },
      download_info: {
        date: '20240101',
        directory: dir,
        total_files: 1,
        total_size_mb: 0.001,
        total_rows: 1,
      },
      files: [
        {
          filename: 'a.csv',
          path: path.join(dir, 'a.csv'),
          size_bytes: 10,
          size_mb: 0.001,
          sha256: 'a'.repeat(64),
          row_count: 1,
        },
      ],
    };
    await fs.writeFile(path.join(dir, 'download_manifest.json'), JSON.stringify(manifest, null, 2));
    const result = await validateCompletion(dir);
    expect(result.passed).toBe(true);
    expect(result.checks.find((c) => c.name === 'manifest_exists')?.passed).toBe(true);
  });

  it('should fail when manifest is missing', async () => {
    const dir = path.join(process.cwd(), 'jobs/fetch-kaggle/data/tests/tmp-validate-missing');
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const result = await validateCompletion(dir);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.name === 'manifest_exists')?.passed).toBe(false);
  });
});
