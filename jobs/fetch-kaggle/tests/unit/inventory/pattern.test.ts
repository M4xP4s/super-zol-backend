import { describe, it, expect } from 'vitest';
import { extractPatternInfo } from '../../../src/lib/inventory/pattern.js';

describe('extractPatternInfo', () => {
  it('should extract chain and file type from standard filename', () => {
    const result = extractPatternInfo('price_full_file_shufersal_20240101.csv');

    expect(result.chain).toBe('shufersal');
    expect(result.fileType).toBe('price_full');
    expect(result.pattern).toContain('YYYYMMDD');
    expect(result.pattern).toContain('price_full');
    expect(result.pattern).toContain('shufersal');
  });

  it('should handle promo file pattern', () => {
    const result = extractPatternInfo('promo_file_victory_20240115.csv');

    expect(result.chain).toBe('victory');
    expect(result.fileType).toBe('promo');
    expect(result.pattern).toBe('promo_file_victory_YYYYMMDD.csv');
  });

  it('should handle store file pattern', () => {
    const result = extractPatternInfo('store_file_rami_levy_20240201.csv');

    expect(result.chain).toBe('rami_levy');
    expect(result.fileType).toBe('store');
    expect(result.pattern).toBe('store_file_rami_levy_YYYYMMDD.csv');
  });

  it('should handle various naming patterns', () => {
    const patterns = [
      'price_full_file_shufersal_20240101.csv',
      'promo_file_victory_20240115.csv',
      'store_file_rami_levy_20240201.csv',
      'price_full_file_mega_20240301.csv',
    ];

    patterns.forEach((filename) => {
      const result = extractPatternInfo(filename);

      expect(result.chain).toBeTruthy();
      expect(result.fileType).toBeTruthy();
      expect(result.pattern).toContain('YYYYMMDD');
      expect(result.pattern).toMatch(/\.csv$/);
    });
  });

  it('should handle filenames with underscores in chain name', () => {
    const result = extractPatternInfo('price_full_file_rami_levy_super_20240101.csv');

    expect(result.chain).toBe('rami_levy_super');
    expect(result.fileType).toBe('price_full');
    expect(result.pattern).toBe('price_full_file_rami_levy_super_YYYYMMDD.csv');
  });

  it('should handle unknown patterns gracefully with fallback', () => {
    const result = extractPatternInfo('unknown_format.csv');

    // Should still return an object with default values
    expect(result).toHaveProperty('chain');
    expect(result).toHaveProperty('fileType');
    expect(result).toHaveProperty('pattern');
    expect(result.pattern).toBe('unknown_format.csv');
  });

  it('should detect date pattern in filename', () => {
    const result = extractPatternInfo('price_full_file_shufersal_20240131.csv');

    expect(result.pattern).toContain('YYYYMMDD');
    expect(result.pattern).not.toContain('20240131');
  });

  it('should handle different file types correctly', () => {
    const testCases = [
      { filename: 'price_full_file_mega_20240101.csv', expectedType: 'price_full' },
      { filename: 'promo_file_victory_20240101.csv', expectedType: 'promo' },
      { filename: 'store_file_shufersal_20240101.csv', expectedType: 'store' },
      { filename: 'price_file_mega_20240101.csv', expectedType: 'price' },
    ];

    testCases.forEach(({ filename, expectedType }) => {
      const result = extractPatternInfo(filename);
      expect(result.fileType).toBe(expectedType);
    });
  });

  it('should extract consistent patterns for same file type and chain', () => {
    const result1 = extractPatternInfo('price_full_file_shufersal_20240101.csv');
    const result2 = extractPatternInfo('price_full_file_shufersal_20240228.csv');

    expect(result1.pattern).toBe(result2.pattern);
    expect(result1.chain).toBe(result2.chain);
    expect(result1.fileType).toBe(result2.fileType);
  });

  it('should handle edge case of very short filename', () => {
    const result = extractPatternInfo('a.csv');

    expect(result).toHaveProperty('chain');
    expect(result).toHaveProperty('fileType');
    expect(result).toHaveProperty('pattern');
  });

  it('should handle non-standard filenames with date patterns', () => {
    // Files that have dates but don't match the standard pattern
    const result = extractPatternInfo('custom_dataset_20240101.csv');

    expect(result.chain).toBe('unknown');
    expect(result.fileType).toBe('unknown');
    // Should replace the date with YYYYMMDD
    expect(result.pattern).toBe('custom_dataset_YYYYMMDD.csv');
  });

  it('should handle files with dates in middle of name', () => {
    const result = extractPatternInfo('data_20240215_export.csv');

    expect(result.chain).toBe('unknown');
    expect(result.fileType).toBe('unknown');
    // Should replace first date occurrence with YYYYMMDD
    expect(result.pattern).toBe('data_YYYYMMDD_export.csv');
  });

  it('should fallback to unknown for completely non-standard names without dates', () => {
    const result = extractPatternInfo('random-file-no-date.csv');

    expect(result.chain).toBe('unknown');
    expect(result.fileType).toBe('unknown');
    // No date to replace, pattern should be the filename itself
    expect(result.pattern).toBe('random-file-no-date.csv');
  });
});
