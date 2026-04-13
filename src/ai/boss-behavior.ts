// src/ai/boss-behavior.ts
import type { Entity } from '@/entity/entity'

const DEG2RAD = Math.PI / 180

function distanceBetween(a: Entity, b: Entity): number {
  const dx = a.position.x - b.position.x
  const dy = a.position.y - b.position.y
  return Math.sqrt(dx * dx + dy * dy)
}

function angleBetween(from: Entity, to: Entity): number {
  const dx = to.position.x - from.position.x
  const dy = to.position.y - from.position.y
  return ((Math.atan2(dx, dy) / DEG2RAD) + 360) % 360
}

export class BossBehavior {
  private facingLocked = false
  private autoAttackAccum = 0
  /** Aggro range — player entering this 120° frontal cone triggers combat */
  private aggroRange: number
  private aggroAngle = 120

  constructor(
    private boss: Entity,
    private autoAttackRange: number,
    private autoAttackInterval: number,
    aggroRange?: number,
  ) {
    this.aggroRange = aggroRange ?? autoAttackRange
  }

  /**
   * Check if a player should trigger aggro (enter combat).
   * Conditions: player within aggroRange AND within frontal aggroAngle cone,
   * OR player has dealt damage to this boss (handled externally).
   */
  checkAggro(player: Entity): boolean {
    if (this.boss.inCombat) return false

    const dist = distanceBetween(this.boss, player)
    if (dist > this.aggroRange) return false

    // Check frontal cone
    const angleToPlayer = angleBetween(this.boss, player)
    let diff = Math.abs(angleToPlayer - this.boss.facing)
    if (diff > 180) diff = 360 - diff
    return diff <= this.aggroAngle / 2
  }

  engage(): void {
    this.boss.inCombat = true
  }

  updateFacing(target: Entity): void {
    if (this.boss.casting) return
    if (this.facingLocked) return

    const dx = target.position.x - this.boss.position.x
    const dy = target.position.y - this.boss.position.y
    if (dx === 0 && dy === 0) return

    this.boss.facing = ((Math.atan2(dx, dy) / DEG2RAD) + 360) % 360
  }

  updateMovement(target: Entity, dt: number): void {
    if (this.boss.casting) return

    const dx = target.position.x - this.boss.position.x
    const dy = target.position.y - this.boss.position.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Already in range (stop slightly inside)
    if (dist <= this.autoAttackRange - 0.1) return

    const moveDistance = this.boss.speed * (dt / 1000)
    const ratio = Math.min(moveDistance / dist, 1)
    this.boss.position.x += dx * ratio
    this.boss.position.y += dy * ratio
  }

  lockFacing(angle: number): void {
    this.facingLocked = true
    this.boss.facing = angle
  }

  unlockFacing(): void {
    this.facingLocked = false
  }

  tickAutoAttack(dt: number): boolean {
    if (!this.boss.inCombat) return false
    if (this.boss.casting) return false

    this.autoAttackAccum += dt
    if (this.autoAttackAccum >= this.autoAttackInterval) {
      this.autoAttackAccum -= this.autoAttackInterval
      return true
    }
    return false
  }

  /** Check if target is within auto-attack range and in frontal 180° */
  isInAutoAttackRange(target: Entity): boolean {
    const dist = distanceBetween(this.boss, target)
    if (dist > this.autoAttackRange) return false

    const angleToTarget = angleBetween(this.boss, target)
    let diff = Math.abs(angleToTarget - this.boss.facing)
    if (diff > 180) diff = 360 - diff
    return diff <= 90 // frontal 180°
  }
}
