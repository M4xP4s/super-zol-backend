/**
 * Domain entities for schema profiling
 * Based on TODO.md Phase 1.2
 */

export interface ColumnSummary {
  name: string;
  dtype: string;
  null_count: number;
  null_rate: number;
  unique_count: number;
  sample_values: unknown[];
  min?: number | string;
  max?: number | string;
}

export interface FileProfile {
  family: string;
  chain: string;
  filename: string;
  row_count: number;
  source_path: string;
  columns: ColumnSummary[];
}

export interface DataProfile {
  generated_at: string;
  source_directory: string;
  dataset_date: string;
  total_patterns: number;
  profiles: FileProfile[];
}
