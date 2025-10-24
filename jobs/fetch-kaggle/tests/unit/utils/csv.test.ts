import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { countCSVRows } from '../../../src/lib/utils/csv';

describe('csv utils', () => {
  it('should count rows excluding header', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fk-utils-csv-'));
    const file = path.join(dir, 'test.csv');
    const content = 'col1,col2\n1,2\n3,4\n';
    await fs.writeFile(file, content);
    const count = await countCSVRows(file);
    expect(count).toBe(2);
  });

  it('should handle empty CSV', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fk-utils-csv-'));
    const file = path.join(dir, 'empty.csv');
    await fs.writeFile(file, '');
    const count = await countCSVRows(file);
    expect(count).toBe(0);
  });

  it('should handle malformed CSV gracefully', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fk-utils-csv-'));
    const file = path.join(dir, 'bad.csv');
    const content = 'a,b\n"unterminated,quote\n5,6\n';
    await fs.writeFile(file, content);
    const count = await countCSVRows(file);
    expect(typeof count).toBe('number');
    expect(count ?? 0).toBeGreaterThanOrEqual(0);
  });

  it('should return null for missing file', async () => {
    const count = await countCSVRows('/path/does/not/exist.csv');
    expect(count).toBeNull();
  });
});
