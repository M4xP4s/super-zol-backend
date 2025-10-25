import { promises as fs } from 'node:fs';
import path from 'node:path';
import { KAGGLE_PATHS } from '../../infrastructure/config.js';

export interface KaggleJsonCreds {
  username: string;
  key: string;
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

export async function fixKaggleJsonPermissions(): Promise<void> {
  try {
    await fs.mkdir(path.dirname(KAGGLE_PATHS.kaggleJson), { recursive: true, mode: 0o700 });
  } catch {
    // ignore
  }
  try {
    await fs.chmod(KAGGLE_PATHS.kaggleJson, 0o600);
  } catch {
    // ignore
  }
}

/**
 * Validate ~/.kaggle/kaggle.json structure and permissions.
 * Returns credentials when valid, otherwise null.
 * If permissions are incorrect, attempts to fix to 0600.
 */
export async function checkKaggleJson(): Promise<KaggleJsonCreds | null> {
  try {
    // Ensure file exists
    const stat = await fs.stat(KAGGLE_PATHS.kaggleJson);
    if (!stat.isFile()) return null;

    // Parse JSON and validate shape first
    const raw: unknown = await readJsonFile(KAGGLE_PATHS.kaggleJson);
    const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
    const username = obj && typeof obj.username === 'string' ? obj.username : undefined;
    const key = obj && typeof obj.key === 'string' ? obj.key : undefined;
    if (!username || !key) return null;

    // Then check and fix permissions (best-effort on POSIX)
    const mode = stat.mode & 0o777;
    if (mode !== 0o600) {
      await fixKaggleJsonPermissions();
    }
    return { username, key };
  } catch {
    return null;
  }
}
