import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Command } from 'commander';
import allCommand from '../../../src/cli/commands/all.js';

describe('All Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create all command with correct description', () => {
    const command = allCommand();
    expect(command).toBeInstanceOf(Command);
    expect(command.name()).toBe('all');
    expect(command.description()).toContain('complete workflow');
  });

  it('should have --dataset-id option', () => {
    const command = allCommand();
    const optionNames = command.options.map((opt) => opt.long || opt.short).filter(Boolean);
    expect(optionNames).toContain('--dataset-id');
  });

  it('should have --dry-run option', () => {
    const command = allCommand();
    const optionNames = command.options.map((opt) => opt.long || opt.short).filter(Boolean);
    expect(optionNames).toContain('--dry-run');
  });

  it('should have --data-dir option', () => {
    const command = allCommand();
    const optionNames = command.options.map((opt) => opt.long || opt.short).filter(Boolean);
    expect(optionNames).toContain('--data-dir');
  });

  it('should have --output option', () => {
    const command = allCommand();
    const optionNames = command.options.map((opt) => opt.long || opt.short).filter(Boolean);
    expect(optionNames).toContain('--output');
  });

  it('should be properly configured', () => {
    const command = allCommand();
    expect(command.commands).toBeDefined();
    expect(command.options.length).toBeGreaterThan(0);
  });
});
