// src/tower/events.ts
//
// Tower mode event name constants + strongly-typed emit/on helpers.
// This module only defines the contract — no handlers are registered here.
// Future tasks (stores, scene code) import TOWER_EVENTS.* and use
// onTowerEvent / emitTowerEvent to stay type-safe.
//
// Bus instance strategy (deferred to Phase 2): callers pass their own EventBus
// instance. Phase 2 will introduce a module-level `towerBus` singleton (or a
// Pinia-store-held reference) so all tower code shares one pub/sub channel.
// For Phase 1, no runtime caller exists yet, so the decision is intentionally
// left open.
import type { EventBus } from '@/core/event-bus'
import type { TowerRunPhase } from './types'

export const TOWER_EVENTS = {
  RUN_STARTED: 'tower:run:started',
  RUN_ENDED: 'tower:run:ended',
  PHASE_CHANGED: 'tower:phase:changed',
  NODE_ENTERED: 'tower:node:entered',
  NODE_COMPLETED: 'tower:node:completed',
} as const

/** Payload shapes per event name. */
export interface TowerEventMap {
  'tower:run:started': { runId: string }
  'tower:run:ended': { runId: string; reason: 'victory' | 'exhausted' | 'surrendered' }
  'tower:phase:changed': { from: TowerRunPhase; to: TowerRunPhase }
  'tower:node:entered': { nodeId: number }
  'tower:node:completed': { nodeId: number; outcome: 'victory' | 'surrendered' | 'reward-taken' }
}

export type TowerEventName = keyof TowerEventMap

/** Typed subscriber helper. */
export function onTowerEvent<K extends TowerEventName>(
  bus: EventBus,
  name: K,
  handler: (payload: TowerEventMap[K]) => void,
): void {
  bus.on(name, handler as (payload: unknown) => void)
}

/** Typed emitter helper. */
export function emitTowerEvent<K extends TowerEventName>(
  bus: EventBus,
  name: K,
  payload: TowerEventMap[K],
): void {
  bus.emit(name, payload)
}
