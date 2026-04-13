// src/devtools/commands.test.ts
import { describe, it, expect, vi } from 'vitest'
import { CommandRegistry } from '@/devtools/commands'

describe('CommandRegistry', () => {
  it('should register and execute a command', () => {
    const registry = new CommandRegistry()
    const fn = vi.fn()
    registry.register('test', 'A test command', fn)

    registry.execute('test --flag value')
    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({ flag: 'value' }),
    )
  })

  it('should return error for unknown command', () => {
    const registry = new CommandRegistry()
    const result = registry.execute('unknown')
    expect(result).toContain('Unknown command')
  })

  it('should list all commands with help', () => {
    const registry = new CommandRegistry()
    registry.register('foo', 'Does foo', vi.fn())
    registry.register('bar', 'Does bar', vi.fn())
    const result = registry.execute('help')
    expect(result).toContain('foo')
    expect(result).toContain('bar')
    expect(result).toContain('Does foo')
  })
})
