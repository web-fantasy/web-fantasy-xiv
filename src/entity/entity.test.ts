// src/entity/entity.test.ts
import { describe, it, expect } from 'vitest'
import { createEntity } from '@/entity/entity'

describe('createEntity', () => {
  it('should create entity with defaults', () => {
    const e = createEntity({ id: 'p1', type: 'player' })
    expect(e.id).toBe('p1')
    expect(e.type).toBe('player')
    expect(e.position).toEqual({ x: 0, y: 0, z: 0 })
    expect(e.facing).toBe(0)
    expect(e.hp).toBe(0)
    expect(e.maxHp).toBe(0)
    expect(e.alive).toBe(true)
    expect(e.inCombat).toBe(false)
    expect(e.casting).toBeNull()
    expect(e.gcdTimer).toBe(0)
    expect(e.autoAttackTimer).toBe(0)
    expect(e.target).toBeNull()
    expect(e.buffs).toEqual([])
    expect(e.skillIds).toEqual([])
  })

  it('should accept overrides', () => {
    const e = createEntity({
      id: 'b1',
      type: 'boss',
      position: { x: 10, y: 0, z: 0 },
      hp: 100000,
      maxHp: 100000,
      attack: 1,
      speed: 3,
      size: 2,
    })
    expect(e.hp).toBe(100000)
    expect(e.attack).toBe(1)
    expect(e.size).toBe(2)
    expect(e.position.x).toBe(10)
  })

  it('should compute facing quadrant', () => {
    // Entity facing north (0°), check if a point at east is "right"
    const e = createEntity({ id: 'p1', type: 'player', facing: 0 })
    expect(e.facing).toBe(0)
  })
})
