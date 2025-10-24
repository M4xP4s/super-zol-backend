import { describe, it, expect, beforeEach, vi } from 'vitest';

let logs: string[];

// Lazy import after mocks
let utils: typeof import('../../../src/lib/utils/console');

describe('console utils', () => {
  beforeEach(async () => {
    logs = [];
    vi.restoreAllMocks();
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });
    // dynamic import to avoid hoisting between tests
    utils = await import('../../../src/lib/utils/console');
  });

  describe('printSection', () => {
    it('should format section with default params', () => {
      utils.printSection('My Section');
      expect(logs.length).toBe(1);
      const line = logs[0];
      // default width should be >= title length and contain the title once
      expect(line.includes('My Section')).toBe(true);
      expect(line.length).toBeGreaterThanOrEqual('My Section'.length);
      // line should be a single line with no newlines
      expect(line.includes('\n')).toBe(false);
    });

    it('should respect width parameter', () => {
      utils.printSection('Width Test', { width: 40 });
      const line = logs[0];
      expect(line.length).toBe(40);
    });

    it('should use custom fill character', () => {
      utils.printSection('Fill Test', { width: 30, fill: '-' });
      const line = logs[0];
      // ensure fill character is used around the title
      const before = line.split('Fill Test')[0];
      const after = line.split('Fill Test')[1];
      expect(
        before
          .replace(/\s+/g, '')
          .split('')
          .every((c) => c === '-')
      ).toBe(true);
      expect(
        after
          .replace(/\s+/g, '')
          .split('')
          .every((c) => c === '-')
      ).toBe(true);
    });

    it('should print long titles without truncation when exceeding width', () => {
      const long = 'X'.repeat(200);
      utils.printSection(long, { width: 60 });
      const line = logs[0];
      expect(line.includes(long)).toBe(true);
      // when longer than width, we print as-is (with spaces around in impl)
      expect(line.length).toBeGreaterThanOrEqual(long.length);
    });
  });

  describe('printBanner', () => {
    it('should center text in banner', () => {
      utils.printBanner('Hello World', { width: 40 });
      expect(logs.length).toBe(3); // top, middle, bottom
      const top = logs[0];
      const mid = logs[1];
      const bot = logs[2];
      expect(top.length).toBe(40);
      expect(bot.length).toBe(40);
      expect(mid.length).toBe(40);
      expect(mid.trim()).toBe('Hello World');
    });

    it('should handle edge cases (empty, very long text)', () => {
      utils.printBanner('', { width: 20 });
      expect(logs.length).toBe(3);

      logs = [];
      const long = 'x'.repeat(200);
      expect(() => utils.printBanner(long, { width: 50 })).not.toThrow();
      // If text is longer than width, implementation may print it as-is
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it('should use default width when not provided', () => {
      utils.printBanner('Default Width');
      expect(logs.length).toBe(3);
      expect(logs[0].length).toBe(60);
      expect(logs[1].length).toBe(60);
      expect(logs[2].length).toBe(60);
    });

    it('should fallback to default width when non-positive provided', () => {
      // @ts-expect-error testing runtime behavior with invalid width
      utils.printBanner('Invalid Width', { width: 0 });
      expect(logs[0].length).toBe(60);
    });
  });
});
