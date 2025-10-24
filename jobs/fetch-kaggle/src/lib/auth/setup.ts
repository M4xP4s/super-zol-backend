import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { KAGGLE_PATHS } from '../../infrastructure/config';
import { fixKaggleJsonPermissions, checkKaggleJson } from './kaggle-json';

export async function openBrowserToKaggle(): Promise<void> {
  try {
    const { execa } = await import('execa');
    const url = KAGGLE_PATHS.apiTokenUrl;
    if (process.platform === 'darwin') {
      await execa('open', [url]);
    } else if (process.platform === 'win32') {
      await execa('cmd', ['/c', 'start', url]);
    } else {
      await execa('xdg-open', [url]);
    }
  } catch {
    // best-effort; ignore if cannot open browser
  }
}

export async function findKaggleJsonInDownloads(): Promise<string | null> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (!home) return null;
  const candidate = path.join(home, 'Downloads', 'kaggle.json');
  try {
    const stat = await fs.stat(candidate);
    return stat.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

async function copyToKaggleDir(srcPath: string): Promise<void> {
  await fs.mkdir(path.dirname(KAGGLE_PATHS.kaggleJson), { recursive: true, mode: 0o700 });
  await fs.copyFile(srcPath, KAGGLE_PATHS.kaggleJson);
  await fixKaggleJsonPermissions();
}

/**
 * Interactive-ish setup that tries sensible defaults and prompts for a custom path when needed.
 * Returns true if credentials were successfully configured.
 */
export async function setupKaggleJson(): Promise<boolean> {
  // Already configured?
  const existing = await checkKaggleJson();
  if (existing) return true;

  // Try Downloads first
  const inDownloads = await findKaggleJsonInDownloads();
  if (inDownloads) {
    await copyToKaggleDir(inDownloads);

    // Offer to remove original from Downloads
    try {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = (await rl.question('Remove kaggle.json from Downloads? (y/N) '))
        .trim()
        .toLowerCase();
      rl.close();
      if (answer === 'y' || answer === 'yes') {
        await fs.unlink(inDownloads);
      }
    } catch {
      // ignore failures
    }
    return true;
  }

  // Prompt for custom path or open browser to generate one
  try {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const input = (
      await rl.question('Path to kaggle.json (Enter to open Kaggle token page): ')
    ).trim();
    rl.close();
    if (!input) {
      await openBrowserToKaggle();
      return false;
    }
    // Validate and copy
    const stat = await fs.stat(input);
    if (!stat.isFile()) return false;
    await copyToKaggleDir(input);
    return true;
  } catch {
    return false;
  }
}
