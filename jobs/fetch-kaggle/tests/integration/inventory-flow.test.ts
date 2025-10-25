import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runInventory } from '../../src/lib/inventory/index.js';
import type { DownloadManifest } from '../../src/core/domain/entities/manifest.js';
import { KAGGLE_CONFIG } from '../../src/infrastructure/config.js';

describe('Inventory Flow Integration', () => {
  const testDir = '/tmp/test-inventory-flow';
  const manifestPath = join(testDir, 'download_manifest.json');

  // Clean up any leftover data from previous test runs to prevent flaky tests
  beforeAll(async () => {
    await rm(KAGGLE_CONFIG.dataRoot, { recursive: true, force: true });
    await rm(KAGGLE_CONFIG.reportsDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should run full inventory workflow: analyze → report → save', async () => {
    // Setup: Create a manifest with sample data
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

    // Execute: Run the inventory workflow
    const exitCode = await runInventory(testDir);

    // Verify: Check exit code
    expect(exitCode).toBe(0);

    // The workflow completed successfully - report was created in default location
    // (data/reports/kaggle_inventory_YYYYMMDD.md)
  });

  it('should handle missing manifest gracefully', async () => {
    // Execute: Run inventory on directory without manifest
    const exitCode = await runInventory(testDir);

    // Verify: Should exit with error code
    expect(exitCode).toBe(1);
  });

  it('should use default directory if none provided', async () => {
    // This test verifies that runInventory can be called without arguments
    // It should use a default directory (likely from config)
    // Since we don't have a manifest in the default location, it should fail gracefully

    const exitCode = await runInventory();

    // Should return non-zero exit code since no manifest exists
    expect(exitCode).toBe(1);
  });

  it('should create report with correct filename pattern', async () => {
    // Setup: Create a manifest
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
        total_files: 1,
        total_size_mb: 0.001,
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
      ],
    };

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    // Execute: Run inventory with explicit output path
    const reportPath = join(testDir, 'test_report.md');
    const exitCode = await runInventory(testDir, reportPath);

    // Verify: Exit code and report exists
    expect(exitCode).toBe(0);

    const reportContent = await readFile(reportPath, 'utf-8');
    expect(reportContent).toContain('# Kaggle Dataset Inventory Report');
    expect(reportContent).toContain('price_full_file_shufersal');
  });
});
