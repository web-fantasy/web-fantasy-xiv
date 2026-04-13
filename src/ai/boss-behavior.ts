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

export interface BossBehaviorConfig {
  /** Distance boss chases to (stops at chaseRange - 0.1). Default: 5 */
  chaseRange: number
  /** Distance within which auto-attack hits. Should be > chaseRange so
   *  player can't dodge autos by micro-moving. Default: 7 */
  autoAttackRange: number
  /** Auto-attack interval in ms. Default: 3000 */
  autoAttackInterval: number
  /** Aggro detection range (frontal cone). Default: chaseRange */
  aggroRange?: number
  /** Aggro frontal cone angle in degrees. Default: 120 */
  aggroAngle?: number
}

const DEFAULT_CONFIG: BossBehaviorConfig = {
  chaseRange: 5,
  autoAttackRange: 15,
  autoAttackInterval: 3000,
}

export class BossBehavior {
  private facingLocked = false
  private autoAttackAccum = 0
  readonly config: BossBehaviorConfig

  constructor(
    private boss: Entity,
    config?: Partial<BossBehaviorConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    // chaseRange defaults to autoAttackRange if not explicitly set
    if (config && config.autoAttackRange != null && config.chaseRange == null) {
      this.config.chaseRange = this.config.autoAttackRange
    }
    // Guard: chaseRange must not exceed autoAttackRange
    if (this.config.chaseRange > this.config.autoAttackRange) {
      this.config.chaseRange = this.config.autoAttackRange
    }
    if (this.config.aggroRange == null) {
      this.config.aggroRange = this.config.chaseRange
    }
  }

  checkAggro(player: Entity): boolean {
    if (this.boss.inCombat) return false

    const dist = distanceBetween(this.boss, player)
    if (dist > this.config.aggroRange!) return false

    const aggroAngle = this.config.aggroAngle ?? 120
    const angleToPlayer = angleBetween(this.boss, player)
    let diff = Math.abs(angleToPlayer - this.boss.facing)
    if (diff > 180) diff = 360 - diff
    return diff <= aggroAngle / 2
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

    // Stop when within chase range (slight margin inside)
    if (dist <= this.config.chaseRange - 0.1) return

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
    if (this.autoAttackAccum >= this.config.autoAttackInterval) {
      this.autoAttackAccum -= this.config.autoAttackInterval
      return true
    }
    return false
  }

  /** Auto-attack hits if target is within autoAttackRange and in frontal 180° */
  isInAutoAttackRange(target: Entity): boolean {
    const dist = distanceBetween(this.boss, target)
    if (dist > this.config.autoAttackRange) return false

    const angleToTarget = angleBetween(this.boss, target)
    let diff = Math.abs(angleToTarget - this.boss.facing)
    if (diff > 180) diff = 360 - diff
    return diff <= 90
  }
}
