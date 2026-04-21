// src/tower/pools/battlefield-condition-pool.ts
//
// Battlefield condition pool resolver（照搬 encounter-pool.ts 模板）
// - Registry: manifest 全部 entries（含 deprecated）
// - Active Pool: !deprecated entries
// - Fallback: resolveCondition miss 时返回 FALLBACK_CONDITION_ID + console.error
//
// 详见 docs/tower-engineering-principles.md §2 Pool Registry / Active Pool.

import { createRng } from '@/tower/random'

export type BattlefieldConditionKind = 'echo'

export interface BattlefieldConditionPoolEntry {
  id: string
  kind: BattlefieldConditionKind
  params: {
    determinationThreshold: number
    allStatsBonusPct: number
  }
  scoutSummary: string
  /** ISO date / sentinel; non-undefined = excluded from Active Pool */
  deprecated?: string
}

interface BattlefieldConditionPoolManifest {
  manifestVersion: number
  entries: BattlefieldConditionPoolEntry[]
}

export const FALLBACK_CONDITION_ID = 'echo-fallback'
const MANIFEST_URL = `${import.meta.env.BASE_URL}tower/pools/battlefield-condition-pool.json`

let poolCache: BattlefieldConditionPoolManifest | null = null
let inflight: Promise<BattlefieldConditionPoolManifest> | null = null

/** Test-only: reset module-level cache. */
export function _resetBattlefieldConditionPoolCache(): void {
  poolCache = null
  inflight = null
}

export async function loadBattlefieldConditionPool(): Promise<BattlefieldConditionPoolManifest> {
  if (poolCache) return poolCache
  if (inflight) return inflight
  inflight = (async () => {
    const res = await fetch(MANIFEST_URL)
    if (!res.ok) {
      throw new Error(`[battlefield-condition-pool] manifest fetch failed: ${res.status}`)
    }
    const manifest = (await res.json()) as BattlefieldConditionPoolManifest
    poolCache = manifest
    inflight = null
    return manifest
  })()
  return inflight
}

/**
 * Resolve a condition id to its manifest entry. Walks the full Registry
 * (including deprecated entries). Falls back to FALLBACK_CONDITION_ID
 * + console.error when id is missing.
 *
 * Normal operation (per append-only contract) should never hit the fallback;
 * only triggered by misconfiguration (deleted manifest entry).
 */
export async function resolveCondition(id: string): Promise<BattlefieldConditionPoolEntry> {
  const manifest = await loadBattlefieldConditionPool()
  const found = manifest.entries.find((e) => e.id === id)
  if (found) return found
  console.error(
    `[battlefield-condition-pool] resolveCondition('${id}') miss — Registry contract violated. ` +
      `Falling back to '${FALLBACK_CONDITION_ID}'. Check manifest entry not deleted.`,
  )
  const fallback = manifest.entries.find((e) => e.id === FALLBACK_CONDITION_ID)
  if (!fallback) {
    throw new Error(
      `[battlefield-condition-pool] FALLBACK entry '${FALLBACK_CONDITION_ID}' missing from manifest — ` +
        `this is a hard project invariant violation.`,
    )
  }
  return fallback
}

/**
 * Pick a condition id from Active Pool (!deprecated) deterministically by seed.
 *
 * NOTE: Phase 5 does NOT use this from startDescent() — condition mounting
 * is inline in encounter yaml's top-level `conditions: [id, ...]` field
 * (see Task 16), not node-level crystallization. Kept here for future use
 * cases (e.g. random boss condition rotation per run).
 */
export async function pickConditionIdFromActivePool(
  seed: string,
  contextId: string,
  kind: BattlefieldConditionKind,
): Promise<string> {
  const manifest = await loadBattlefieldConditionPool()
  const active = manifest.entries.filter((e) => !e.deprecated && e.kind === kind)
  if (active.length === 0) {
    throw new Error(
      `[battlefield-condition-pool] active pool for kind='${kind}' is empty — check manifest`,
    )
  }
  const rng = createRng(`${seed}::condition::${contextId}`)
  const idx = Math.floor(rng() * active.length)
  return active[idx].id
}
