import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function findLatestDirectory(root: string, pattern: RegExp): Promise<string> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const candidates = entries
    .filter((e) => e.isDirectory() && pattern.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  if (candidates.length === 0) {
    throw new Error('No matching directories found');
  }
  return path.join(root, candidates[0]!);
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
