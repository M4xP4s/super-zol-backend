/**
 * Domain entities for download manifest
 * Based on TODO.md Phase 1.1
 */

export interface FileMetadata {
  filename: string;
  path: string;
  size_bytes: number;
  size_mb: number;
  sha256: string;
  row_count: number | null;
}

export interface DownloadManifest {
  dataset: {
    name: string;
    kaggle_id: string;
    url: string;
    download_timestamp: string;
  };
  download_info: {
    date: string;
    directory: string;
    total_files: number;
    total_size_mb: number;
    total_rows: number;
  };
  files: FileMetadata[];
}
