// src/core/game-loop.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GameLoop, LOGIC_TICK } from '@/core/game-loop'

describe('GameLoop', () => {
  it('should export LOGIC_TICK as 16', () => {
    expect(LOGIC_TICK).toBe(16)
  })

  it('should call update with fixed timestep', () => {
    const loop = new GameLoop()
    const update = vi.fn()
    loop.onUpdate(update)

    // Simulate 48ms elapsed — should produce 3 logic ticks
    loop.tick(48)
    expect(update).toHaveBeenCalledTimes(3)
    expect(update).toHaveBeenCalledWith(LOGIC_TICK)
  })

  it('should accumulate fractional time', () => {
    const loop = new GameLoop()
    const update = vi.fn()
    loop.onUpdate(update)

    // 10ms — not enough for a tick
    loop.tick(10)
    expect(update).not.toHaveBeenCalled()

    // another 10ms — now 20ms total, 1 tick
    loop.tick(10)
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('should track logicTime correctly', () => {
    const loop = new GameLoop()
    loop.onUpdate(() => {})

    loop.tick(50) // 3 ticks × 16ms = 48ms consumed
    expect(loop.logicTime).toBe(48)

    loop.tick(20) // accumulated 2 + 20 = 22ms, 1 tick
    expect(loop.logicTime).toBe(64)
  })

  it('should return interpolation alpha', () => {
    const loop = new GameLoop()
    loop.onUpdate(() => {})

    loop.tick(24) // 1 tick (16ms), remainder 8ms
    expect(loop.alpha).toBeCloseTo(8 / 16)
  })

  it('should clamp deltaTime to prevent spiral of death', () => {
    const loop = new GameLoop()
    const update = vi.fn()
    loop.onUpdate(update)

    // Simulate a huge lag spike — 1 second
    loop.tick(1000)
    // Should be clamped to max ~250ms = 15 ticks, not 62
    expect(update.mock.calls.length).toBeLessThanOrEqual(16)
  })
})
