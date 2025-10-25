/**
 * Zod schemas for runtime validation
 * Based on TODO.md Phase 1.4
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

export const FileProfileSchema = z.object({
  family: z.string(),
  chain: z.string(),
  filename: z.string(),
  row_count: z.number(),
  source_path: z.string(),
  columns: z.array(ColumnSummarySchema),
});

export const DataProfileSchema = z.object({
  generated_at: z.string(),
  source_directory: z.string(),
  dataset_date: z.string(),
  total_patterns: z.number(),
  profiles: z.array(FileProfileSchema),
});
