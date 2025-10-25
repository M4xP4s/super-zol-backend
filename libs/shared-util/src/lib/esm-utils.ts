import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

/**
 * Get the directory name from import.meta.url (ESM equivalent of __dirname)
 *
 * @param importMetaUrl - The import.meta.url value from the calling module
 * @returns The directory path of the calling module
 *
 * @example
 * ```typescript
 * import { getDirname } from '@libs/shared-util';
 *
 * const __dirname = getDirname(import.meta.url);
 * console.log(__dirname); // /path/to/current/directory
 * ```
 */
export function getDirname(importMetaUrl: string): string {
  return dirname(fileURLToPath(importMetaUrl));
}

/**
 * Get the file path from import.meta.url (ESM equivalent of __filename)
 *
 * @param importMetaUrl - The import.meta.url value from the calling module
 * @returns The file path of the calling module
 *
 * @example
 * ```typescript
 * import { getFilename } from '@libs/shared-util';
 *
 * const __filename = getFilename(import.meta.url);
 * console.log(__filename); // /path/to/current/file.js
 * ```
 */
export function getFilename(importMetaUrl: string): string {
  return fileURLToPath(importMetaUrl);
}
