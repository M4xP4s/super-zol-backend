import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { generateReport } from '../../../src/lib/inventory/report';
import type { InventoryAnalysis } from '../../../src/core/domain/entities/inventory';

describe('generateReport', () => {
  const testDir = '/tmp/test-inventory-report';
  const reportPath = join(testDir, 'inventory_report.md');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should create valid Markdown structure', async () => {
    const analysis: InventoryAnalysis = {
      files: [
        {
          filename: 'price_full_file_shufersal_20240101.csv',
          path: './price_full_file_shufersal_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'a'.repeat(64),
          row_count: 100,
        },
      ],
      patterns: {
        'price_full_file_shufersal_YYYYMMDD.csv': [
          {
            filename: 'price_full_file_shufersal_20240101.csv',
            path: './price_full_file_shufersal_20240101.csv',
            size_bytes: 1024,
            size_mb: 0.001,
            sha256: 'a'.repeat(64),
            row_count: 100,
          },
        ],
      },
      chains: { shufersal: 1 },
      fileTypes: { price_full: 1 },
      summary: {
        total_files: 1,
        total_size_mb: 0.001,
        total_rows: 100,
      },
    };

    const result = await generateReport(analysis, '/data/kaggle_raw/20240101', reportPath);

    expect(result).toBe(reportPath);

    const content = await readFile(reportPath, 'utf-8');

    // Check for Markdown headers
    expect(content).toContain('# Kaggle Dataset Inventory Report');
    expect(content).toMatch(/^## /m); // At least one section header
  });

  it('should include all required sections', async () => {
    const analysis: InventoryAnalysis = {
      files: [
        {
          filename: 'price_full_file_shufersal_20240101.csv',
          path: './price_full_file_shufersal_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'a'.repeat(64),
          row_count: 100,
        },
        {
          filename: 'promo_file_victory_20240101.csv',
          path: './promo_file_victory_20240101.csv',
          size_bytes: 2048,
          size_mb: 0.002,
          sha256: 'b'.repeat(64),
          row_count: 200,
        },
      ],
      patterns: {
        'price_full_file_shufersal_YYYYMMDD.csv': [
          {
            filename: 'price_full_file_shufersal_20240101.csv',
            path: './price_full_file_shufersal_20240101.csv',
            size_bytes: 1024,
            size_mb: 0.001,
            sha256: 'a'.repeat(64),
            row_count: 100,
          },
        ],
        'promo_file_victory_YYYYMMDD.csv': [
          {
            filename: 'promo_file_victory_20240101.csv',
            path: './promo_file_victory_20240101.csv',
            size_bytes: 2048,
            size_mb: 0.002,
            sha256: 'b'.repeat(64),
            row_count: 200,
          },
        ],
      },
      chains: { shufersal: 1, victory: 1 },
      fileTypes: { price_full: 1, promo: 1 },
      summary: {
        total_files: 2,
        total_size_mb: 0.003,
        total_rows: 300,
      },
    };

    await generateReport(analysis, '/data/kaggle_raw/20240101', reportPath);

    const content = await readFile(reportPath, 'utf-8');

    // Required sections
    expect(content).toContain('## Executive Summary');
    expect(content).toContain('## Files by Pattern');
    expect(content).toContain('## Chain Distribution');
    expect(content).toContain('## File Type Distribution');
  });

  it('should display correct summary statistics', async () => {
    const analysis: InventoryAnalysis = {
      files: [
        {
          filename: 'price_full_file_shufersal_20240101.csv',
          path: './price_full_file_shufersal_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'a'.repeat(64),
          row_count: 100,
        },
        {
          filename: 'promo_file_victory_20240101.csv',
          path: './promo_file_victory_20240101.csv',
          size_bytes: 2048,
          size_mb: 0.002,
          sha256: 'b'.repeat(64),
          row_count: 200,
        },
      ],
      patterns: {
        'price_full_file_shufersal_YYYYMMDD.csv': [
          {
            filename: 'price_full_file_shufersal_20240101.csv',
            path: './price_full_file_shufersal_20240101.csv',
            size_bytes: 1024,
            size_mb: 0.001,
            sha256: 'a'.repeat(64),
            row_count: 100,
          },
        ],
        'promo_file_victory_YYYYMMDD.csv': [
          {
            filename: 'promo_file_victory_20240101.csv',
            path: './promo_file_victory_20240101.csv',
            size_bytes: 2048,
            size_mb: 0.002,
            sha256: 'b'.repeat(64),
            row_count: 200,
          },
        ],
      },
      chains: { shufersal: 1, victory: 1 },
      fileTypes: { price_full: 1, promo: 1 },
      summary: {
        total_files: 2,
        total_size_mb: 0.003,
        total_rows: 300,
      },
    };

    await generateReport(analysis, '/data/kaggle_raw/20240101', reportPath);

    const content = await readFile(reportPath, 'utf-8');

    // Check statistics are present
    expect(content).toContain('2'); // total files
    expect(content).toContain('300'); // total rows
    expect(content).toMatch(/0\.003|0\.00/); // total size (may be formatted)
  });

  it('should list patterns with file counts', async () => {
    const analysis: InventoryAnalysis = {
      files: [
        {
          filename: 'price_full_file_shufersal_20240101.csv',
          path: './price_full_file_shufersal_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'a'.repeat(64),
          row_count: 100,
        },
        {
          filename: 'price_full_file_shufersal_20240102.csv',
          path: './price_full_file_shufersal_20240102.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'b'.repeat(64),
          row_count: 100,
        },
      ],
      patterns: {
        'price_full_file_shufersal_YYYYMMDD.csv': [
          {
            filename: 'price_full_file_shufersal_20240101.csv',
            path: './price_full_file_shufersal_20240101.csv',
            size_bytes: 1024,
            size_mb: 0.001,
            sha256: 'a'.repeat(64),
            row_count: 100,
          },
          {
            filename: 'price_full_file_shufersal_20240102.csv',
            path: './price_full_file_shufersal_20240102.csv',
            size_bytes: 1024,
            size_mb: 0.001,
            sha256: 'b'.repeat(64),
            row_count: 100,
          },
        ],
      },
      chains: { shufersal: 2 },
      fileTypes: { price_full: 2 },
      summary: {
        total_files: 2,
        total_size_mb: 0.002,
        total_rows: 200,
      },
    };

    await generateReport(analysis, '/data/kaggle_raw/20240101', reportPath);

    const content = await readFile(reportPath, 'utf-8');

    expect(content).toContain('price_full_file_shufersal_YYYYMMDD.csv');
    expect(content).toContain('**Files:** 2'); // Should show file count
  });

  it('should display chain distribution', async () => {
    const analysis: InventoryAnalysis = {
      files: [
        {
          filename: 'price_full_file_shufersal_20240101.csv',
          path: './price_full_file_shufersal_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'a'.repeat(64),
          row_count: 100,
        },
        {
          filename: 'promo_file_victory_20240101.csv',
          path: './promo_file_victory_20240101.csv',
          size_bytes: 2048,
          size_mb: 0.002,
          sha256: 'b'.repeat(64),
          row_count: 200,
        },
      ],
      patterns: {
        'price_full_file_shufersal_YYYYMMDD.csv': [
          {
            filename: 'price_full_file_shufersal_20240101.csv',
            path: './price_full_file_shufersal_20240101.csv',
            size_bytes: 1024,
            size_mb: 0.001,
            sha256: 'a'.repeat(64),
            row_count: 100,
          },
        ],
        'promo_file_victory_YYYYMMDD.csv': [
          {
            filename: 'promo_file_victory_20240101.csv',
            path: './promo_file_victory_20240101.csv',
            size_bytes: 2048,
            size_mb: 0.002,
            sha256: 'b'.repeat(64),
            row_count: 200,
          },
        ],
      },
      chains: { shufersal: 1, victory: 1 },
      fileTypes: { price_full: 1, promo: 1 },
      summary: {
        total_files: 2,
        total_size_mb: 0.003,
        total_rows: 300,
      },
    };

    await generateReport(analysis, '/data/kaggle_raw/20240101', reportPath);

    const content = await readFile(reportPath, 'utf-8');

    expect(content).toContain('shufersal');
    expect(content).toContain('victory');
  });

  it('should display file type distribution', async () => {
    const analysis: InventoryAnalysis = {
      files: [
        {
          filename: 'price_full_file_shufersal_20240101.csv',
          path: './price_full_file_shufersal_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'a'.repeat(64),
          row_count: 100,
        },
        {
          filename: 'promo_file_victory_20240101.csv',
          path: './promo_file_victory_20240101.csv',
          size_bytes: 2048,
          size_mb: 0.002,
          sha256: 'b'.repeat(64),
          row_count: 200,
        },
      ],
      patterns: {
        'price_full_file_shufersal_YYYYMMDD.csv': [
          {
            filename: 'price_full_file_shufersal_20240101.csv',
            path: './price_full_file_shufersal_20240101.csv',
            size_bytes: 1024,
            size_mb: 0.001,
            sha256: 'a'.repeat(64),
            row_count: 100,
          },
        ],
        'promo_file_victory_YYYYMMDD.csv': [
          {
            filename: 'promo_file_victory_20240101.csv',
            path: './promo_file_victory_20240101.csv',
            size_bytes: 2048,
            size_mb: 0.002,
            sha256: 'b'.repeat(64),
            row_count: 200,
          },
        ],
      },
      chains: { shufersal: 1, victory: 1 },
      fileTypes: { price_full: 1, promo: 1 },
      summary: {
        total_files: 2,
        total_size_mb: 0.003,
        total_rows: 300,
      },
    };

    await generateReport(analysis, '/data/kaggle_raw/20240101', reportPath);

    const content = await readFile(reportPath, 'utf-8');

    expect(content).toContain('price_full');
    expect(content).toContain('promo');
  });

  it('should save report to correct location', async () => {
    const analysis: InventoryAnalysis = {
      files: [],
      patterns: {},
      chains: {},
      fileTypes: {},
      summary: {
        total_files: 0,
        total_size_mb: 0,
        total_rows: 0,
      },
    };

    const result = await generateReport(analysis, '/data/kaggle_raw/20240101', reportPath);

    expect(result).toBe(reportPath);

    // Verify file was created
    const content = await readFile(reportPath, 'utf-8');
    expect(content).toBeTruthy();
  });

  it('should handle empty analysis gracefully', async () => {
    const analysis: InventoryAnalysis = {
      files: [],
      patterns: {},
      chains: {},
      fileTypes: {},
      summary: {
        total_files: 0,
        total_size_mb: 0,
        total_rows: 0,
      },
    };

    await generateReport(analysis, '/data/kaggle_raw/20240101', reportPath);

    const content = await readFile(reportPath, 'utf-8');

    expect(content).toContain('# Kaggle Dataset Inventory Report');
    expect(content).toContain('0'); // Should show 0 files
  });

  it('should include directory path in report', async () => {
    const analysis: InventoryAnalysis = {
      files: [],
      patterns: {},
      chains: {},
      fileTypes: {},
      summary: {
        total_files: 0,
        total_size_mb: 0,
        total_rows: 0,
      },
    };

    const targetDir = '/data/kaggle_raw/20240101';
    await generateReport(analysis, targetDir, reportPath);

    const content = await readFile(reportPath, 'utf-8');

    expect(content).toContain(targetDir);
  });
});
