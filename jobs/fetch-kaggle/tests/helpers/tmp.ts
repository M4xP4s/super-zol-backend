import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Creates a temporary directory for testing.
 * @returns Promise resolving to the path of the created temp directory
 */
export async function makeTempDir(): Promise<string> {
  const prefix = join(tmpdir(), 'fetch-kaggle-test-');
  return mkdtemp(prefix);
}

/**
 * Removes a temporary directory and all its contents.
 * @param dirPath - Path to the directory to remove
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
    console.warn(`Warning: Could not clean up ${dirPath}:`, error);
  }
}

/**
 * Writes a CSV file with the given rows to the specified path.
 * @param filePath - Absolute path where the CSV should be written
 * @param rows - Array of rows, where each row is an array of cell values
 * @returns Promise that resolves when the file is written
 */
export async function writeCSV(filePath: string, rows: string[][]): Promise<void> {
  const csvContent = rows.map((row) => row.join(',')).join('\n');
  await writeFile(filePath, csvContent, 'utf-8');
}

/**
 * Creates a directory structure within a base path.
 * @param basePath - Base directory path
 * @param structure - Object describing the directory structure
 * @returns Promise that resolves when the structure is created
 */
export async function createDirStructure(
  basePath: string,
  structure: Record<string, string | null>
): Promise<void> {
  for (const [path, content] of Object.entries(structure)) {
    const fullPath = join(basePath, path);

    if (content === null) {
      // It's a directory
      await mkdir(fullPath, { recursive: true });
    } else {
      // It's a file
      const dir = join(fullPath, '..');
      await mkdir(dir, { recursive: true });
      await writeFile(fullPath, content, 'utf-8');
    }
  }
}
