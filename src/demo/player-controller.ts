// src/demo/player-controller.ts
import type { Entity } from '@/entity/entity'
import type { Vec2 } from '@/core/types'
import type { InputManager } from '@/input/input-manager'
import type { SkillResolver } from '@/skill/skill-resolver'
import type { BuffSystem } from '@/combat/buff'
import type { EntityManager } from '@/entity/entity-manager'
import type { EventBus } from '@/core/event-bus'
import type { SkillDef } from '@/core/types'
import type { Arena } from '@/arena/arena'
import { computeMoveDirection, computeFacingAngle } from '@/input/input-manager'
import { calcDash, calcBackstep } from '@/combat/displacement'

export function applyMovement(entity: Entity, direction: Vec2, dt: number): void {
  if (direction.x === 0 && direction.y === 0) return
  const distance = entity.speed * (dt / 1000)
  entity.position.x += direction.x * distance
  entity.position.y += direction.y * distance
}

export class PlayerController {
  constructor(
    private player: Entity,
    private input: InputManager,
    private skillResolver: SkillResolver,
    private buffSystem: BuffSystem,
    private entityMgr: EntityManager,
    private bus: EventBus,
    private skills: SkillDef[],
    private arena: Arena,
    private autoAttackInterval: number,
    private autoAttackSkill?: SkillDef,
    private extraSkills: Map<number, SkillDef> = new Map(),
  ) {}

  /** Returns 'pause' if ESC should trigger pause menu (no higher-priority action consumed it) */
  update(dt: number): 'pause' | null {
    // ESC priority chain: interrupt cast → release target → pause
    if (this.input.consumeEsc()) {
      if (this.player.casting) {
        this.skillResolver.interruptCast(this.player)
      } else if (this.player.target) {
        this.player.target = null
        this.bus.emit('target:released', { entity: this.player })
      } else {
        return 'pause'
      }
    }

    // Movement (blocked while stunned, but interrupts casting)
    if (!this.buffSystem.isStunned(this.player)) {
      const dir = computeMoveDirection(this.input.keys)
      if (dir.x !== 0 || dir.y !== 0) {
        // Moving interrupts casting
        if (this.player.casting) {
          this.skillResolver.interruptCast(this.player)
        }

        const speedMod = this.buffSystem.getSpeedModifier(this.player)
        const modifiedSpeed = this.player.speed * (1 + speedMod)
        const distance = modifiedSpeed * (dt / 1000)
        this.player.position.x += dir.x * distance
        this.player.position.y += dir.y * distance

        // Clamp to arena
        const clamped = this.arena.clampPosition({
          x: this.player.position.x,
          y: this.player.position.y,
        })
        this.player.position.x = clamped.x
        this.player.position.y = clamped.y
      }
    }

    // Facing follows mouse
    this.player.facing = computeFacingAngle(
      { x: this.player.position.x, y: this.player.position.y },
      this.input.mouse.worldPos,
    )

    // Right click: lock target (pick nearest enemy near mouse)
    if (this.input.mouse.rightDown) {
      const nearest = this.entityMgr.findNearest(
        this.player.id,
        (e) => e.type !== 'player' && e.type !== 'object' && e.alive,
      )
      if (nearest && this.player.target !== nearest.id) {
        this.player.target = nearest.id
        this.bus.emit('target:locked', { entity: this.player, target: nearest })
      }
    }

    // Skill keys (1-6 = skill bar, 100+ = extra keys like Q/E)
    const skillIdx = this.input.consumeSkillPress()
    if (skillIdx !== null) {
      const skill = skillIdx < this.skills.length
        ? this.skills[skillIdx]
        : this.extraSkills.get(skillIdx) ?? null

      if (skill) {
        // Auto-lock nearest enemy if no target and skill requires one
        if (skill.requiresTarget && !this.player.target) {
          const nearest = this.entityMgr.findNearest(
            this.player.id,
            (e) => e.type !== 'player' && e.type !== 'object' && e.alive,
          )
          if (nearest) {
            this.player.target = nearest.id
            this.bus.emit('target:locked', { entity: this.player, target: nearest })
          }
        }

        if (this.skillResolver.tryUse(this.player, skill)) {
          this.applyDisplacementEffects(skill)
        }
      }
    }

    // Auto-attack when target locked (uses dedicated auto-attack skill, no GCD)
    if (this.player.target && this.player.inCombat && this.autoAttackSkill) {
      this.player.autoAttackTimer += dt
      if (this.player.autoAttackTimer >= this.autoAttackInterval) {
        this.player.autoAttackTimer -= this.autoAttackInterval
        this.skillResolver.tryUse(this.player, this.autoAttackSkill)
      }
    }

    // Tick GCD / casting
    this.skillResolver.update(this.player, dt)
    this.skillResolver.updateCooldowns(this.player, dt)
    this.buffSystem.update(this.player, dt)

    return null
  }

  private applyDisplacementEffects(skill: SkillDef): void {
    if (!skill.effects) return
    const target = this.player.target ? this.entityMgr.get(this.player.target) : null

    for (const effect of skill.effects) {
      if (effect.type === 'dash' && target) {
        const newPos = calcDash(
          { x: this.player.position.x, y: this.player.position.y },
          { x: target.position.x, y: target.position.y },
        )
        const clamped = this.arena.clampPosition(newPos)
        this.player.position.x = clamped.x
        this.player.position.y = clamped.y
      }

      if (effect.type === 'backstep' && target) {
        const newPos = calcBackstep(
          { x: this.player.position.x, y: this.player.position.y },
          { x: target.position.x, y: target.position.y },
          effect.distance,
        )
        const clamped = this.arena.clampPosition(newPos)
        this.player.position.x = clamped.x
        this.player.position.y = clamped.y
      }
    }
  }
}
