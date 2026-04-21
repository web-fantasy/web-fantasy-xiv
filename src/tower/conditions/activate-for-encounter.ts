// src/tower/conditions/activate-for-encounter.ts
// Helper called by EncounterRunner (Task 17) to activate all battlefield conditions
// declared in an encounter yaml's top-level `conditions: string[]` field.
//
// Iterates `encounter.conditions`, resolves each id via the battlefield-condition
// pool (Registry walk — includes deprecated entries, fallback on miss), and
// dispatches to `activateCondition` which applies the corresponding buff
// (phase 5 MVP: only `echo` kind is implemented).

import { resolveCondition } from '@/tower/pools/battlefield-condition-pool'
import {
  activateCondition,
  type ConditionActivationScene,
  type ConditionTowerContext,
} from './echo'

export interface EncounterConditionSource {
  conditions?: string[]
}

export async function activateConditionsForEncounter(
  encounter: EncounterConditionSource,
  scene: ConditionActivationScene,
  ctx: ConditionTowerContext,
): Promise<void> {
  const ids = encounter.conditions ?? []
  for (const id of ids) {
    const cond = await resolveCondition(id)
    activateCondition(cond, scene, ctx)
  }
}
