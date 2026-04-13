// src/ai/boss-behavior.test.ts
import { describe, it, expect } from 'vitest'
import { BossBehavior } from '@/ai/boss-behavior'
import { createEntity } from '@/entity/entity'

describe('BossBehavior', () => {
  function setup() {
    const boss = createEntity({
      id: 'boss', type: 'boss',
      position: { x: 0, y: 0, z: 0 },
      speed: 3, size: 2,
    })
    const player = createEntity({
      id: 'p1', type: 'player',
      position: { x: 5, y: 0, z: 0 },
    })
    const behavior = new BossBehavior(boss, 5, 3000) // range=5, autoInterval=3000
    return { boss, player, behavior }
  }

  it('should face toward target', () => {
    const { boss, player, behavior } = setup()
    behavior.updateFacing(player)
    // Player is at (5,0), boss at (0,0) → facing east = 90°
    expect(boss.facing).toBeCloseTo(90, 0)
  })

  it('should move toward target if out of range', () => {
    const { boss, player, behavior } = setup()
    player.position = { x: 20, y: 0, z: 0 }
    behavior.updateMovement(player, 1000) // 1 second at speed 3
    // Boss should have moved toward player
    expect(boss.position.x).toBeGreaterThan(0)
    expect(boss.position.x).toBeCloseTo(3, 0) // speed * dt/1000
  })

  it('should not move if already in range', () => {
    const { boss, player, behavior } = setup()
    player.position = { x: 3, y: 0, z: 0 } // within range 5
    const prevX = boss.position.x
    behavior.updateMovement(player, 1000)
    expect(boss.position.x).toBe(prevX)
  })

  it('should not move or change facing while casting', () => {
    const { boss, player, behavior } = setup()
    boss.casting = { skillId: 'raidwide', targetId: null, elapsed: 0, castTime: 3000 }
    player.position = { x: 20, y: 0, z: 0 }
    const prevFacing = boss.facing
    behavior.updateMovement(player, 1000)
    behavior.updateFacing(player)
    expect(boss.position.x).toBe(0)
    expect(boss.facing).toBe(prevFacing)
  })

  it('should respect facing lock', () => {
    const { boss, player, behavior } = setup()
    behavior.lockFacing(180)
    expect(boss.facing).toBe(180)
    behavior.updateFacing(player) // should be ignored
    expect(boss.facing).toBe(180)

    behavior.unlockFacing()
    behavior.updateFacing(player)
    expect(boss.facing).not.toBe(180) // now updates
  })

  it('should tick auto-attack timer', () => {
    const { boss, behavior } = setup()
    boss.inCombat = true
    const ready = behavior.tickAutoAttack(1000)
    expect(ready).toBe(false)
    const ready2 = behavior.tickAutoAttack(2000)
    expect(ready2).toBe(true)
  })
})
