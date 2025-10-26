/**
 * Zod schemas for runtime validation
 * Based on TODO.md Phase 1.4
 * Inferred types keep API contracts DRY and in sync with schemas
 */

import { z } from 'zod';

export const FileMetadataSchema = z.object({
  filename: z.string(),
  path: z.string(),
  size_bytes: z.number(),
  size_mb: z.number(),
  sha256: z.string().length(64),
  row_count: z.number().nullable(),
});

/**
 * File metadata type inferred from schema
 * Automatically stays in sync with the Zod schema definition
 */
export type FileMetadata = z.infer<typeof FileMetadataSchema>;

export const DownloadManifestSchema = z.object({
  dataset: z.object({
    name: z.string(),
    kaggle_id: z.string(),
    url: z.string().url(),
    download_timestamp: z.string().datetime(),
  }),
  download_info: z.object({
    date: z.string(),
    directory: z.string(),
    total_files: z.number(),
    total_size_mb: z.number(),
    total_rows: z.number(),
  }),
  files: z.array(FileMetadataSchema),
});

/**
 * Download manifest type inferred from schema
 * Automatically stays in sync with the Zod schema definition
 */
export type DownloadManifest = z.infer<typeof DownloadManifestSchema>;

export const ColumnSummarySchema = z.object({
  name: z.string(),
  dtype: z.string(),
  null_count: z.number(),
  null_rate: z.number(),
  unique_count: z.number(),
  sample_values: z.array(z.unknown()),
  min: z.union([z.number(), z.string()]).optional(),
  max: z.union([z.number(), z.string()]).optional(),
});

/**
 * Column summary type inferred from schema
 * Automatically stays in sync with the Zod schema definition
 */
export type ColumnSummary = z.infer<typeof ColumnSummarySchema>;

export const FileProfileSchema = z.object({
  family: z.string(),
  chain: z.string(),
  filename: z.string(),
  row_count: z.number(),
  source_path: z.string(),
  columns: z.array(ColumnSummarySchema),
});

/**
 * File profile type inferred from schema
 * Automatically stays in sync with the Zod schema definition
 */
export type FileProfile = z.infer<typeof FileProfileSchema>;

export const DataProfileSchema = z.object({
  generated_at: z.string(),
  source_directory: z.string(),
  dataset_date: z.string(),
  total_patterns: z.number(),
  profiles: z.array(FileProfileSchema),
});

/**
 * Data profile type inferred from schema
 * Automatically stays in sync with the Zod schema definition
 */
export type DataProfile = z.infer<typeof DataProfileSchema>;
