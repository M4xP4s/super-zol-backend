import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

/**
 * Type-safe path-like type for directory names and file names
 * Represents a filesystem path as a string
 */
export type PathLike = string & { readonly __brand: 'PathLike' };

/**
 * Get the directory name from import.meta.url (ESM equivalent of __dirname)
 *
 * @param importMetaUrl - The import.meta.url value from the calling module (non-empty string)
 * @returns The directory path of the calling module as a PathLike
 * @throws Error if importMetaUrl is not a valid file:// URL
 *
 * @example
 * ```typescript
 * import { getDirname } from '@libs/shared-util';
 *
 * const __dirname = getDirname(import.meta.url);
 * console.log(__dirname); // /path/to/current/directory
 * ```
 */
export function getDirname(importMetaUrl: string & { length: number }): PathLike;
export function getDirname(importMetaUrl: string): string;
export function getDirname(importMetaUrl: string): string {
  const filePath = fileURLToPath(importMetaUrl);
  return dirname(filePath);
}

/**
 * Get the file path from import.meta.url (ESM equivalent of __filename)
 *
 * @param importMetaUrl - The import.meta.url value from the calling module (non-empty string)
 * @returns The file path of the calling module as a PathLike
 * @throws Error if importMetaUrl is not a valid file:// URL
 *
 * @example
 * ```typescript
 * import { getFilename } from '@libs/shared-util';
 *
 * const __filename = getFilename(import.meta.url);
 * console.log(__filename); // /path/to/current/file.js
 * ```
 */
export function getFilename(importMetaUrl: string & { length: number }): PathLike;
export function getFilename(importMetaUrl: string): string;
export function getFilename(importMetaUrl: string): string {
  return fileURLToPath(importMetaUrl);
}
