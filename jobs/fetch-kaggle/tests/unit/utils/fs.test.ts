import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { ensureDir, findLatestDirectory, fileExists } from '../../../src/lib/utils/fs.js';

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'fk-utils-fs-'));
});

afterEach(async () => {
  // Best-effort cleanup
  try {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

describe('fs utils', () => {
  describe('ensureDir', () => {
    it('should create directory if not exists', async () => {
      const dir = path.join(tmpRoot, 'newdir');
      await ensureDir(dir);
      const stat = await fs.stat(dir);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should not fail if directory exists', async () => {
      const dir = path.join(tmpRoot, 'existing');
      await fs.mkdir(dir, { recursive: true });
      await ensureDir(dir);
      const stat = await fs.stat(dir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('findLatestDirectory', () => {
    it('should return most recent YYYYMMDD directory', async () => {
      const root = path.join(tmpRoot, 'dates');
      await ensureDir(root);
      const dirs = ['20240101', '20240203', '20231231', 'notadate'];
      for (const d of dirs) {
        await fs.mkdir(path.join(root, d), { recursive: true });
      }
      const latest = await findLatestDirectory(root, /^\d{8}$/);
      expect(path.basename(latest)).toBe('20240203');
    });

    it('should throw if no directories found', async () => {
      const root = path.join(tmpRoot, 'empty');
      await ensureDir(root);
      await expect(findLatestDirectory(root, /^\d{8}$/)).rejects.toThrow();
    });
  });

  describe('fileExists', () => {
    it('returns true for existing file and false for missing', async () => {
      const file = path.join(tmpRoot, 'file.txt');
      await fs.writeFile(file, 'hello');
      await expect(fileExists(file)).resolves.toBe(true);
      await expect(fileExists(path.join(tmpRoot, 'none.txt'))).resolves.toBe(false);
    });
  });
});
