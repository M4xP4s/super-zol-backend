import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Command } from 'commander';
import profileCommand from '../../../src/cli/commands/profile.js';

describe('Profile Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create profile command with correct description', () => {
    const command = profileCommand();
    expect(command).toBeInstanceOf(Command);
    expect(command.name()).toBe('profile');
    expect(command.description()).toContain('Profile dataset schema');
  });

  it('should have --data-dir option', () => {
    const command = profileCommand();
    const optionNames = command.options.map((opt) => opt.long || opt.short).filter(Boolean);
    expect(optionNames).toContain('--data-dir');
  });

  it('should have --output option', () => {
    const command = profileCommand();
    const optionNames = command.options.map((opt) => opt.long || opt.short).filter(Boolean);
    expect(optionNames).toContain('--output');
  });

  it('should be properly configured', () => {
    const command = profileCommand();
    expect(command.commands).toBeDefined();
    expect(command.options.length).toBeGreaterThan(0);
  });
});
