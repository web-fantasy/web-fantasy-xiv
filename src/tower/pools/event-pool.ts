// src/tower/pools/event-pool.ts
// Event pool resolver. Template identical to encounter-pool / battlefield-condition-pool.
// See docs/tower-engineering-principles.md §2.

import { createRng } from '@/tower/random'

export interface EventPoolEntry {
  id: string
  yamlPath: string
  deprecated?: string
}

interface EventPoolManifest {
  manifestVersion: number
  entries: EventPoolEntry[]
}

export const FALLBACK_EVENT_ID = 'event-fallback'
const MANIFEST_URL = `${import.meta.env.BASE_URL}tower/pools/event-pool.json`

let poolCache: EventPoolManifest | null = null
let inflight: Promise<EventPoolManifest> | null = null

/** Test-only: reset module-level cache. */
export function _resetEventPoolCache(): void {
  poolCache = null
  inflight = null
}

export async function loadEventPool(): Promise<EventPoolManifest> {
  if (poolCache) return poolCache
  if (inflight) return inflight
  inflight = (async () => {
    const res = await fetch(MANIFEST_URL)
    if (!res.ok) {
      throw new Error(`[event-pool] manifest fetch failed: ${res.status}`)
    }
    const manifest = (await res.json()) as EventPoolManifest
    poolCache = manifest
    inflight = null
    return manifest
  })()
  return inflight
}

/**
 * Resolve an event id to its manifest entry. Walks the full Registry
 * (including deprecated entries). Falls back to FALLBACK_EVENT_ID
 * + console.error when id is missing.
 */
export async function resolveEventEntry(id: string): Promise<EventPoolEntry> {
  const manifest = await loadEventPool()
  const found = manifest.entries.find((e) => e.id === id)
  if (found) return found
  console.error(
    `[event-pool] resolveEventEntry('${id}') miss — Registry contract violated. ` +
      `Falling back to '${FALLBACK_EVENT_ID}'. Check manifest entry not deleted.`,
  )
  const fallback = manifest.entries.find((e) => e.id === FALLBACK_EVENT_ID)
  if (!fallback) {
    throw new Error(
      `[event-pool] FALLBACK entry '${FALLBACK_EVENT_ID}' missing from manifest — ` +
        `this is a hard project invariant violation.`,
    )
  }
  return fallback
}

/**
 * Pick an event id from Active Pool (!deprecated) deterministically by seed.
 * Used at startDescent() to crystallize eventId into each event node.
 */
export async function pickEventIdFromActivePool(
  seed: string,
  nodeId: number,
): Promise<string> {
  const manifest = await loadEventPool()
  const active = manifest.entries.filter((e) => !e.deprecated)
  if (active.length === 0) {
    throw new Error(`[event-pool] active pool is empty — check manifest`)
  }
  const rng = createRng(`${seed}::event::${nodeId}`)
  const idx = Math.floor(rng() * active.length)
  return active[idx].id
}
