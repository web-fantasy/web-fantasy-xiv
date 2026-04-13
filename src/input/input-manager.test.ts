// src/input/input-manager.test.ts
import { describe, it, expect } from 'vitest'
import { InputState, computeMoveDirection, computeFacingAngle } from '@/input/input-manager'

describe('computeMoveDirection', () => {
  it('should return (0,1) for W only', () => {
    const dir = computeMoveDirection({ w: true, a: false, s: false, d: false })
    expect(dir.x).toBeCloseTo(0)
    expect(dir.y).toBeCloseTo(1)
  })

  it('should return normalized diagonal for W+D', () => {
    const dir = computeMoveDirection({ w: true, a: false, s: false, d: true })
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y)
    expect(len).toBeCloseTo(1)
    expect(dir.x).toBeGreaterThan(0)
    expect(dir.y).toBeGreaterThan(0)
  })

  it('should return (0,0) when no keys', () => {
    const dir = computeMoveDirection({ w: false, a: false, s: false, d: false })
    expect(dir.x).toBe(0)
    expect(dir.y).toBe(0)
  })

  it('should cancel out opposing keys', () => {
    const dir = computeMoveDirection({ w: true, a: false, s: true, d: false })
    expect(dir.x).toBe(0)
    expect(dir.y).toBe(0)
  })
})

describe('computeFacingAngle', () => {
  it('should compute angle from entity to mouse in game coords', () => {
    // Entity at origin, mouse directly north (+y in screen = +y in game)
    // But screen Y is inverted: mouse above entity means smaller screenY
    // We pass world-space mouse position, so mouse at (0, 5) = north
    const angle = computeFacingAngle({ x: 0, y: 0 }, { x: 0, y: 5 })
    expect(angle).toBeCloseTo(0, 0) // 0° = north
  })

  it('should compute 90° for mouse to the east', () => {
    const angle = computeFacingAngle({ x: 0, y: 0 }, { x: 5, y: 0 })
    expect(angle).toBeCloseTo(90, 0)
  })
})
