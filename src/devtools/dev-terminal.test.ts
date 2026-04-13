// src/devtools/dev-terminal.test.ts
import { describe, it, expect } from 'vitest'
import { DevTerminal } from '@/devtools/dev-terminal'
import { EventBus } from '@/core/event-bus'
import { CommandRegistry } from '@/devtools/commands'

describe('DevTerminal', () => {
  it('should log events from EventBus', () => {
    const bus = new EventBus()
    const registry = new CommandRegistry()
    const terminal = new DevTerminal(bus, registry)

    bus.emit('damage:dealt', { source: { id: 'p1' }, target: { id: 'b1' }, amount: 2000, skill: { name: 'Slash' } })

    const logs = terminal.getLogs()
    expect(logs.length).toBeGreaterThan(0)
    expect(logs[0]).toContain('p1')
    expect(logs[0]).toContain('2000')
  })

  it('should format skill:cast_start events', () => {
    const bus = new EventBus()
    const registry = new CommandRegistry()
    const terminal = new DevTerminal(bus, registry)

    bus.emit('skill:cast_start', { caster: { id: 'p1' }, skill: { name: 'Fire I' } })

    const logs = terminal.getLogs()
    expect(logs[0]).toContain('p1')
    expect(logs[0]).toContain('Fire I')
  })
})
