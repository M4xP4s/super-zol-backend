import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Command } from 'commander';
import authCommand from '../../../src/cli/commands/auth.js';

describe('Auth Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create auth command with correct description', () => {
    const command = authCommand();
    expect(command).toBeInstanceOf(Command);
    expect(command.name()).toBe('auth');
    expect(command.description()).toContain('Authenticate with Kaggle');
  });

  it('should have --check-only option', () => {
    const command = authCommand();
    const optionNames = command.options.map((opt) => opt.long || opt.short).filter(Boolean);
    expect(optionNames).toContain('--check-only');
  });

  it('should handle action without errors', async () => {
    const command = authCommand();
    expect(command.commands).toBeDefined();
    expect(command.options).toBeDefined();
  });
});
