import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

/**
 * Calculate the SHA-256 checksum of a file using a streaming reader.
 *
 * This function reads the file in chunks to avoid loading the entire file into memory,
 * making it suitable for large files. An optional `onProgress` callback can be supplied
 * to receive the cumulative number of processed bytes.
 *
 * @param filePath - Absolute path to the file to hash
 * @param options - Optional configuration
 * @param options.onProgress - Callback invoked with the number of processed bytes
 * @returns A promise that resolves to the lowercase hexadecimal SHA-256 digest
 */
export async function calculateSHA256(
  filePath: string,
  options?: { onProgress?: (bytes: number) => void }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    let processed = 0;
    const stream = createReadStream(filePath) as unknown as NodeJS.ReadableStream & {
      on(event: 'data', listener: (chunk: Buffer) => void): unknown;
    };
    stream.on('data', (chunk: Buffer) => {
      hash.update(chunk);
      processed += chunk.length;
      options?.onProgress?.(processed);
    });
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}
