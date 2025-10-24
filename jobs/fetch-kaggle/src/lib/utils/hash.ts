import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

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
