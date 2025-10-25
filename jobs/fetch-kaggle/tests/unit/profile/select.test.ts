import { describe, it, expect } from 'vitest';
import { chooseRepresentativeFiles } from '../../../src/lib/profile/select.js';
import type { FileMetadata } from '../../../src/core/domain/entities/manifest.js';

describe('chooseRepresentativeFiles', () => {
  it('should select one file per family', () => {
    const files: FileMetadata[] = [
      {
        filename: 'price_full_file_shufersal_20240101.csv',
        path: '/data/price_full_file_shufersal_20240101.csv',
        size_bytes: 1024,
        size_mb: 0.001,
        sha256: 'a'.repeat(64),
        row_count: 100,
      },
      {
        filename: 'price_full_file_shufersal_20240102.csv',
        path: '/data/price_full_file_shufersal_20240102.csv',
        size_bytes: 2048,
        size_mb: 0.002,
        sha256: 'b'.repeat(64),
        row_count: 200,
      },
      {
        filename: 'promo_file_shufersal_20240101.csv',
        path: '/data/promo_file_shufersal_20240101.csv',
        size_bytes: 512,
        size_mb: 0.0005,
        sha256: 'c'.repeat(64),
        row_count: 50,
      },
    ];

    const selected = chooseRepresentativeFiles(files);

    // Should have 2 families (price_full and promo)
    expect(selected).toHaveLength(2);

    // Should have one of each family
    const families = selected.map((f) => f.family);
    expect(families).toContain('price_full');
    expect(families).toContain('promo');
  });

  it('should prefer files with higher row counts when selecting per family', () => {
    const files: FileMetadata[] = [
      {
        filename: 'price_full_file_shufersal_20240101.csv',
        path: '/data/price_full_file_shufersal_20240101.csv',
        size_bytes: 1024,
        size_mb: 0.001,
        sha256: 'a'.repeat(64),
        row_count: 50,
      },
      {
        filename: 'price_full_file_shufersal_20240102.csv',
        path: '/data/price_full_file_shufersal_20240102.csv',
        size_bytes: 2048,
        size_mb: 0.002,
        sha256: 'b'.repeat(64),
        row_count: 500, // Higher row count
      },
    ];

    const selected = chooseRepresentativeFiles(files);

    expect(selected).toHaveLength(1);
    expect(selected[0]?.filename).toBe('price_full_file_shufersal_20240102.csv');
    expect(selected[0]?.rowCount).toBe(500);
  });

  it('should handle empty array', () => {
    const selected = chooseRepresentativeFiles([]);
    expect(selected).toHaveLength(0);
  });

  it('should handle single file', () => {
    const files: FileMetadata[] = [
      {
        filename: 'price_full_file_shufersal_20240101.csv',
        path: '/data/price_full_file_shufersal_20240101.csv',
        size_bytes: 1024,
        size_mb: 0.001,
        sha256: 'a'.repeat(64),
        row_count: 100,
      },
    ];

    const selected = chooseRepresentativeFiles(files);

    expect(selected).toHaveLength(1);
    expect(selected[0]?.family).toBe('price_full');
  });

  it('should skip files with null row count', () => {
    const files: FileMetadata[] = [
      {
        filename: 'price_full_file_shufersal_20240101.csv',
        path: '/data/price_full_file_shufersal_20240101.csv',
        size_bytes: 1024,
        size_mb: 0.001,
        sha256: 'a'.repeat(64),
        row_count: null,
      },
      {
        filename: 'price_full_file_shufersal_20240102.csv',
        path: '/data/price_full_file_shufersal_20240102.csv',
        size_bytes: 2048,
        size_mb: 0.002,
        sha256: 'b'.repeat(64),
        row_count: 100,
      },
    ];

    const selected = chooseRepresentativeFiles(files);

    expect(selected).toHaveLength(1);
    expect(selected[0]?.rowCount).toBe(100);
  });

  it('should handle files with unknown family gracefully', () => {
    const files: FileMetadata[] = [
      {
        filename: 'random_file.csv',
        path: '/data/random_file.csv',
        size_bytes: 1024,
        size_mb: 0.001,
        sha256: 'a'.repeat(64),
        row_count: 100,
      },
    ];

    const selected = chooseRepresentativeFiles(files);

    expect(selected).toHaveLength(1);
    expect(selected[0]?.family).toBe('unknown');
  });

  it('should select highest row count across multiple families with multiple files each', () => {
    const files: FileMetadata[] = [
      {
        filename: 'price_full_file_shufersal_20240101.csv',
        path: '/data/price_full_file_shufersal_20240101.csv',
        size_bytes: 1024,
        size_mb: 0.001,
        sha256: 'a'.repeat(64),
        row_count: 100,
      },
      {
        filename: 'price_full_file_rami_20240101.csv',
        path: '/data/price_full_file_rami_20240101.csv',
        size_bytes: 2048,
        size_mb: 0.002,
        sha256: 'b'.repeat(64),
        row_count: 300,
      },
      {
        filename: 'promo_file_shufersal_20240101.csv',
        path: '/data/promo_file_shufersal_20240101.csv',
        size_bytes: 512,
        size_mb: 0.0005,
        sha256: 'c'.repeat(64),
        row_count: 50,
      },
      {
        filename: 'promo_file_rami_20240101.csv',
        path: '/data/promo_file_rami_20240101.csv',
        size_bytes: 1024,
        size_mb: 0.001,
        sha256: 'd'.repeat(64),
        row_count: 200,
      },
    ];

    const selected = chooseRepresentativeFiles(files);

    expect(selected).toHaveLength(2);

    const priceFullSelected = selected.find((f) => f.family === 'price_full');
    expect(priceFullSelected?.rowCount).toBe(300);

    const promoSelected = selected.find((f) => f.family === 'promo');
    expect(promoSelected?.rowCount).toBe(200);
  });
});
