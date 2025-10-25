import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Command } from 'commander';
import downloadCommand from '../../../src/cli/commands/download.js';

describe('Download Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create download command with correct description', () => {
    const command = downloadCommand();
    expect(command).toBeInstanceOf(Command);
    expect(command.name()).toBe('download');
    expect(command.description()).toContain('Download Kaggle dataset');
  });

  it('should have --dataset-id option', () => {
    const command = downloadCommand();
    const optionNames = command.options.map((opt) => opt.long || opt.short).filter(Boolean);
    expect(optionNames).toContain('--dataset-id');
  });

  it('should have --dry-run option', () => {
    const command = downloadCommand();
    const optionNames = command.options.map((opt) => opt.long || opt.short).filter(Boolean);
    expect(optionNames).toContain('--dry-run');
  });

  it('should be properly configured', () => {
    const command = downloadCommand();
    expect(command.commands).toBeDefined();
    expect(command.options.length).toBeGreaterThan(0);
  });
});
