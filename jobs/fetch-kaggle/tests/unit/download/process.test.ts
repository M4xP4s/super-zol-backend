import { describe, it, expect, beforeEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { processFiles } from '../../../src/lib/download/process.js';

const tmpRoot = path.join(process.cwd(), 'jobs/fetch-kaggle/data/tests/tmp-process');

async function write(file: string, content: string) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
}

describe('processFiles', () => {
  beforeEach(async () => {
    // reset tmp dir
    await fs.rm(tmpRoot, { recursive: true, force: true });
    await fs.mkdir(tmpRoot, { recursive: true });
  });

  it('should calculate checksums and row counts for CSV files', async () => {
    const f1 = path.join(tmpRoot, 'a.csv');
    const f2 = path.join(tmpRoot, 'b.csv');
    await write(f1, 'h1\n1\n2\n'); // 2 data rows
    await write(f2, 'h2\n3\n'); // 1 data row

    const result = await processFiles(tmpRoot);
    expect(result.totalFiles).toBe(2);
    expect(result.totalRows).toBe(3);
    expect(result.files).toHaveLength(2);
    for (const f of result.files) {
      expect(f.sha256).toMatch(/^[a-f0-9]{64}$/);
      if (f.filename === 'a.csv') expect(f.row_count).toBe(2);
      if (f.filename === 'b.csv') expect(f.row_count).toBe(1);
    }
  });

  it('should handle directories with no CSV files', async () => {
    const result = await processFiles(tmpRoot);
    expect(result.totalFiles).toBe(0);
    expect(result.totalRows).toBe(0);
    expect(result.totalSizeMB).toBe(0);
    expect(result.files).toEqual([]);
  });
});
