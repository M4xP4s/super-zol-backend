/**
 * CSV profiler utilities for schema profiling.
 * Profiles individual CSV files and generates detailed column statistics.
 */

import * as fs from 'fs/promises';
import { summarizeColumn } from './column.js';
import type { FileTarget } from '../../core/domain/entities/inventory.js';
import type { FileProfile } from '../../core/domain/entities/profile.js';

/**
 * Simple CSV parser that handles basic CSV format.
 * Handles quoted fields and simple escape sequences.
 *
 * @param content - CSV content as string
 * @returns Array of records where each record is a key-value object
 */
function parseCSV(content: string): Record<string, string | null>[] {
  const lines = content.split('\n');
  if (lines.length === 0) {
    return [];
  }

  // Parse header row
  const headerLine = lines[0];
  if (!headerLine) {
    return [];
  }

  const headers = parseCSVLine(headerLine);

  // Parse data rows
  const records: Record<string, string | null>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') {
      continue;
    }

    const values = parseCSVLine(line);

    // Create record object
    const record: Record<string, string | null> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (header) {
        record[header] = values[j] ?? '';
      }
    }

    records.push(record);
  }

  return records;
}

/**
 * Parse a single CSV line, handling quoted fields.
 *
 * @param line - A single CSV line
 * @returns Array of values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current);

  return values;
}

/**
 * Profiles a CSV file and generates column statistics.
 *
 * Reads the CSV file, parses all rows, and generates summary statistics
 * for each column including: null rate, unique count, data type, samples, min/max.
 *
 * @param targetDir - Directory containing the CSV file
 * @param fileTarget - FileTarget object with filename, family, chain, path, rowCount
 * @returns FileProfile object with family, chain, filename, and column summaries
 * @throws Error if file cannot be read or parsed
 *
 * @example
 * ```typescript
 * const profile = await profileFile('/data/kaggle_raw/20240101', {
 *   filename: 'price_full_file_shufersal_20240101.csv',
 *   family: 'price_full',
 *   chain: 'shufersal',
 *   path: '/data/kaggle_raw/20240101/price_full_file_shufersal_20240101.csv',
 *   rowCount: 50000
 * });
 * ```
 */
export async function profileFile(targetDir: string, fileTarget: FileTarget): Promise<FileProfile> {
  // Read the CSV file
  const content = await fs.readFile(fileTarget.path, 'utf-8');

  // Parse the CSV (first row is headers)
  const records = parseCSV(content);

  // Get column names from the first record
  let columnNames: string[] = [];
  if (records.length > 0 && records[0]) {
    columnNames = Object.keys(records[0]);
  }

  // Organize data by column
  const columnData: Record<string, unknown[]> = {};

  for (const colName of columnNames) {
    columnData[colName] = [];
  }

  // Fill column data
  for (const record of records) {
    for (const colName of columnNames) {
      const value = record[colName];
      const colArray = columnData[colName];

      if (!colArray) {
        continue;
      }

      // Treat empty strings as null
      if (value === '' || value === null) {
        colArray.push(null);
      } else {
        // Try to parse as number
        const numValue = Number(value);
        if (!Number.isNaN(numValue) && value !== '' && value !== 'null') {
          colArray.push(numValue);
        } else {
          colArray.push(value);
        }
      }
    }
  }

  // Summarize each column
  const columns = [];
  for (const colName of columnNames) {
    const colData = columnData[colName] ?? [];
    const summary = summarizeColumn(colData, colName, fileTarget.rowCount);
    columns.push(summary);
  }

  return {
    family: fileTarget.family,
    chain: fileTarget.chain,
    filename: fileTarget.filename,
    row_count: fileTarget.rowCount,
    source_path: fileTarget.path,
    columns,
  };
}
