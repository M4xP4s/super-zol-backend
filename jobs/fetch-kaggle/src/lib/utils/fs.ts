import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Ensure a directory exists (creates it recursively if missing).
 *
 * @param dirPath - Absolute or relative path to create
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Find the most recent directory (by lexicographic order) under a root that matches a pattern.
 *
 * Useful for resolving a latest YYYYMMDD-style directory.
 *
 * @param root - Directory to search
 * @param pattern - Regex to match candidate directory names
 * @returns Absolute path to the latest matching directory
 * @throws Error when no matching directories are found
 */
export async function findLatestDirectory(root: string, pattern: RegExp): Promise<string> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const candidates = entries
    .filter((e) => e.isDirectory() && pattern.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  const latest = candidates[0];
  if (!latest) {
    throw new Error('No matching directories found');
  }
  return path.join(root, latest);
}

/**
 * Check whether a file or directory exists.
 *
 * @param p - Path to test
 * @returns True when accessible, false otherwise
 */
export async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
