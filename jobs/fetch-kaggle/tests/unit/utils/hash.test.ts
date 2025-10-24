import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { calculateSHA256 } from '../../../src/lib/utils/hash';

describe('hash utils', () => {
  it('should calculate correct SHA256 for file', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'fk-utils-hash-'));
    const file = path.join(tmp, 'hello.txt');
    await fs.writeFile(file, 'hello');
    const hash = await calculateSHA256(file);
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('should handle large files efficiently', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'fk-utils-hash-'));
    const file = path.join(tmp, 'large.bin');
    const chunk = Buffer.alloc(1024 * 1024, 'a'); // 1MB
    const fd = await fs.open(file, 'w');
    try {
      for (let i = 0; i < 5; i++) {
        await fd.write(chunk, 0, chunk.length);
      }
    } finally {
      await fd.close();
    }
    const hash = await calculateSHA256(file);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should throw on non-existent file', async () => {
    await expect(calculateSHA256('/path/does/not/exist.txt')).rejects.toBeTruthy();
  });

  it('should report progress via callback', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'fk-utils-hash-'));
    const file = path.join(tmp, 'progress.bin');
    const chunk = Buffer.alloc(1024 * 1024, 'b');
    const fd = await fs.open(file, 'w');
    try {
      for (let i = 0; i < 2; i++) {
        await fd.write(chunk, 0, chunk.length);
      }
    } finally {
      await fd.close();
    }
    let last = 0;
    const hash = await calculateSHA256(file, {
      onProgress: (bytes) => {
        last = bytes;
      },
    });
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(last).toBeGreaterThan(0);
  });
});
