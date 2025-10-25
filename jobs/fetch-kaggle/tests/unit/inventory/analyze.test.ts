import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { analyzeDirectory } from '../../../src/lib/inventory/analyze';
import type { DownloadManifest } from '../../../src/core/domain/entities/manifest';

describe('analyzeDirectory', () => {
  const testDir = '/tmp/test-inventory-analyze';
  const manifestPath = join(testDir, 'download_manifest.json');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should load manifest and group files by pattern', async () => {
    const manifest: DownloadManifest = {
      dataset: {
        name: 'Test Dataset',
        kaggle_id: 'test/dataset',
        url: 'https://kaggle.com/datasets/test/dataset',
        download_timestamp: new Date().toISOString(),
      },
      download_info: {
        date: '20240101',
        directory: testDir,
        total_files: 3,
        total_size_mb: 0.003,
        total_rows: 300,
      },
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
        {
          filename: 'promo_file_victory_20240101.csv',
          path: './promo_file_victory_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'c'.repeat(64),
          row_count: 100,
        },
      ],
    };

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    const result = await analyzeDirectory(testDir);

    expect(result).toBeTruthy();
    expect(result?.files).toHaveLength(3);
    expect(result?.patterns).toHaveProperty('price_full_file_shufersal_YYYYMMDD.csv');
    expect(result?.patterns).toHaveProperty('promo_file_victory_YYYYMMDD.csv');
    expect(result?.patterns['price_full_file_shufersal_YYYYMMDD.csv']).toHaveLength(2);
    expect(result?.patterns['promo_file_victory_YYYYMMDD.csv']).toHaveLength(1);
  });

  it('should aggregate stats by chain', async () => {
    const manifest: DownloadManifest = {
      dataset: {
        name: 'Test Dataset',
        kaggle_id: 'test/dataset',
        url: 'https://kaggle.com/datasets/test/dataset',
        download_timestamp: new Date().toISOString(),
      },
      download_info: {
        date: '20240101',
        directory: testDir,
        total_files: 4,
        total_size_mb: 0.004,
        total_rows: 400,
      },
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
        {
          filename: 'promo_file_victory_20240101.csv',
          path: './promo_file_victory_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'c'.repeat(64),
          row_count: 100,
        },
        {
          filename: 'store_file_mega_20240101.csv',
          path: './store_file_mega_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'd'.repeat(64),
          row_count: 100,
        },
      ],
    };

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    const result = await analyzeDirectory(testDir);

    expect(result).toBeTruthy();
    expect(result?.chains).toHaveProperty('shufersal');
    expect(result?.chains).toHaveProperty('victory');
    expect(result?.chains).toHaveProperty('mega');
    expect(result?.chains['shufersal']).toBe(2);
    expect(result?.chains['victory']).toBe(1);
    expect(result?.chains['mega']).toBe(1);
  });

  it('should aggregate stats by file type', async () => {
    const manifest: DownloadManifest = {
      dataset: {
        name: 'Test Dataset',
        kaggle_id: 'test/dataset',
        url: 'https://kaggle.com/datasets/test/dataset',
        download_timestamp: new Date().toISOString(),
      },
      download_info: {
        date: '20240101',
        directory: testDir,
        total_files: 4,
        total_size_mb: 0.004,
        total_rows: 400,
      },
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
          filename: 'price_full_file_mega_20240101.csv',
          path: './price_full_file_mega_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'b'.repeat(64),
          row_count: 100,
        },
        {
          filename: 'promo_file_victory_20240101.csv',
          path: './promo_file_victory_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'c'.repeat(64),
          row_count: 100,
        },
        {
          filename: 'store_file_mega_20240101.csv',
          path: './store_file_mega_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'd'.repeat(64),
          row_count: 100,
        },
      ],
    };

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    const result = await analyzeDirectory(testDir);

    expect(result).toBeTruthy();
    expect(result?.fileTypes).toHaveProperty('price_full');
    expect(result?.fileTypes).toHaveProperty('promo');
    expect(result?.fileTypes).toHaveProperty('store');
    expect(result?.fileTypes['price_full']).toBe(2);
    expect(result?.fileTypes['promo']).toBe(1);
    expect(result?.fileTypes['store']).toBe(1);
  });

  it('should calculate correct summary totals', async () => {
    const manifest: DownloadManifest = {
      dataset: {
        name: 'Test Dataset',
        kaggle_id: 'test/dataset',
        url: 'https://kaggle.com/datasets/test/dataset',
        download_timestamp: new Date().toISOString(),
      },
      download_info: {
        date: '20240101',
        directory: testDir,
        total_files: 3,
        total_size_mb: 0.003,
        total_rows: 350,
      },
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
          row_count: 150,
        },
        {
          filename: 'store_file_mega_20240101.csv',
          path: './store_file_mega_20240101.csv',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'c'.repeat(64),
          row_count: 100,
        },
      ],
    };

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    const result = await analyzeDirectory(testDir);

    expect(result).toBeTruthy();
    expect(result?.summary.total_files).toBe(3);
    expect(result?.summary.total_size_mb).toBeCloseTo(0.004, 3);
    expect(result?.summary.total_rows).toBe(350);
  });

  it('should return null if manifest is missing', async () => {
    const result = await analyzeDirectory(testDir);

    expect(result).toBeNull();
  });

  it('should return null if manifest JSON is invalid', async () => {
    await writeFile(manifestPath, 'invalid json content');

    const result = await analyzeDirectory(testDir);

    expect(result).toBeNull();
  });

  it('should handle manifest with no files', async () => {
    const manifest: DownloadManifest = {
      dataset: {
        name: 'Test Dataset',
        kaggle_id: 'test/dataset',
        url: 'https://kaggle.com/datasets/test/dataset',
        download_timestamp: new Date().toISOString(),
      },
      download_info: {
        date: '20240101',
        directory: testDir,
        total_files: 0,
        total_size_mb: 0,
        total_rows: 0,
      },
      files: [],
    };

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    const result = await analyzeDirectory(testDir);

    expect(result).toBeTruthy();
    expect(result?.files).toHaveLength(0);
    expect(result?.patterns).toEqual({});
    expect(result?.chains).toEqual({});
    expect(result?.fileTypes).toEqual({});
    expect(result?.summary.total_files).toBe(0);
    expect(result?.summary.total_size_mb).toBe(0);
    expect(result?.summary.total_rows).toBe(0);
  });

  it('should handle files with null row_count', async () => {
    const manifest: DownloadManifest = {
      dataset: {
        name: 'Test Dataset',
        kaggle_id: 'test/dataset',
        url: 'https://kaggle.com/datasets/test/dataset',
        download_timestamp: new Date().toISOString(),
      },
      download_info: {
        date: '20240101',
        directory: testDir,
        total_files: 2,
        total_size_mb: 0.002,
        total_rows: 100,
      },
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
          filename: 'unknown_file.txt',
          path: './unknown_file.txt',
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'b'.repeat(64),
          row_count: null,
        },
      ],
    };

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    const result = await analyzeDirectory(testDir);

    expect(result).toBeTruthy();
    expect(result?.summary.total_files).toBe(2);
    expect(result?.summary.total_rows).toBe(100); // Should only count non-null row_count
  });
});
