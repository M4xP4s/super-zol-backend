import { promises as fs } from 'node:fs';
import path from 'node:path';
import { calculateSHA256 } from '../utils/hash';
import { countCSVRows } from '../utils/csv';
import type { FileMetadata } from '../../core/domain/entities/manifest';

export interface ProcessedFilesResult {
  totalFiles: number;
  totalSizeMB: number;
  totalRows: number;
  files: FileMetadata[];
}

export async function processFiles(dir: string): Promise<ProcessedFilesResult> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const csvs = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.csv'));

  const files: FileMetadata[] = [];
  let totalSizeMB = 0;
  let totalRows = 0;

  for (const entry of csvs) {
    const filePath = path.join(dir, entry.name);
    const stat = await fs.stat(filePath);
    const sizeMb = stat.size / (1024 * 1024);
    const sha256 = await calculateSHA256(filePath);
    const rows = (await countCSVRows(filePath)) ?? 0;
    totalSizeMB += sizeMb;
    totalRows += rows;
    files.push({
      filename: entry.name,
      path: filePath,
      size_bytes: stat.size,
      size_mb: Number(sizeMb.toFixed(6)),
      sha256,
      row_count: rows,
    });
  }

  return {
    totalFiles: files.length,
    totalSizeMB: Number(totalSizeMB.toFixed(6)),
    totalRows,
    files,
  };
}
