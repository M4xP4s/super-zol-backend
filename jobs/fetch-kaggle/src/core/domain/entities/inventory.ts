/**
 * Domain entities for inventory analysis
 * Based on TODO.md Phase 1.3
 */

import { FileMetadata } from './manifest.js';

export interface PatternInfo {
  chain: string;
  fileType: string;
  pattern: string;
}

export interface InventoryAnalysis {
  files: FileMetadata[];
  patterns: Record<string, FileMetadata[]>;
  chains: Record<string, number>;
  fileTypes: Record<string, number>;
  summary: {
    total_files: number;
    total_size_mb: number;
    total_rows: number;
  };
}
