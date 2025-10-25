import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

/**
 * Count the number of data rows in a CSV file, excluding a single header line.
 *
 * Returns `null` when the file cannot be read. Empty files return `0`.
 *
 * @param filePath - Absolute path to the CSV file
 * @returns Number of data rows (header excluded) or null on read error
 */
export async function countCSVRows(filePath: string): Promise<number | null> {
  try {
    let lines = 0;
    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      // touch the line var to satisfy lint rules
      if (line || line === '') lines += 1;
    }

    if (lines === 0) return 0;
    // Exclude header row
    return Math.max(0, lines - 1);
  } catch {
    return null;
  }
}
