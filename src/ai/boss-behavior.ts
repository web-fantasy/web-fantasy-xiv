// src/ai/boss-behavior.ts
import type { Entity } from '@/entity/entity'

const DEG2RAD = Math.PI / 180

export class BossBehavior {
  private facingLocked = false
  private autoAttackAccum = 0

  constructor(
    private boss: Entity,
    private autoAttackRange: number,
    private autoAttackInterval: number,
  ) {}

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
}
