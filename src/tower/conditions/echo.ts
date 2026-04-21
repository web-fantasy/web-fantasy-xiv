// src/tower/conditions/echo.ts
// Battlefield condition activation — phase 5 MVP only supports `echo` kind.
// Plan reference: Task 15; Spec §3.2, §3.8.

import type { BattlefieldConditionPoolEntry } from '@/tower/pools/battlefield-condition-pool'
import type { Entity } from '@/entity/entity'
import type { BuffSystem } from '@/combat/buff'
import { COMMON_BUFFS } from '@/jobs/commons/buffs'

export interface ConditionActivationScene {
  player: Entity
  buffSystem: BuffSystem
  gameTime: number
}

export interface ConditionTowerContext {
  determination: number
}

/**
 * Dispatcher for battlefield condition activation.
 * Phase 5 MVP: only `echo` kind is handled. Future kinds (electric-field,
 * phase-2-enrage, etc.) would add new case arms here.
 */
export function activateCondition(
  cond: BattlefieldConditionPoolEntry,
  scene: ConditionActivationScene,
  ctx: ConditionTowerContext,
): void {
  switch (cond.kind) {
    case 'echo':
      return activateEchoCondition(cond, scene, ctx)
    default: {
      const _exhaustive: never = cond.kind
      console.error(`[activateCondition] unhandled kind: ${String(_exhaustive)}`)
    }
  }
}

/**
 * Echo activation: if determination > threshold, skip; otherwise apply
 * COMMON_BUFFS.echo to player (environment-sourced via condition id). Called
 * from EncounterRunner mount (Task 17) when encounter yaml declares
 * `conditions: [echo-boss]`.
 */
function activateEchoCondition(
  cond: BattlefieldConditionPoolEntry,
  scene: ConditionActivationScene,
  ctx: ConditionTowerContext,
): void {
  if (ctx.determination > cond.params.determinationThreshold) return
  scene.buffSystem.applyBuff(scene.player, COMMON_BUFFS.echo, cond.id)
}
