// src/tower/pools/encounter-pool.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadEncounterPool,
  resolveEncounter,
  pickEncounterIdFromActivePool,
  _resetEncounterPoolCache,
  FALLBACK_ENCOUNTER_ID,
  type EncounterPoolEntry,
} from './encounter-pool'

const mockManifest = {
  manifestVersion: 1,
  entries: [
    { id: 'mob-a', yamlPath: 'encounters/tower/mob-a.yaml', kind: 'mob', scoutSummary: 'A', rewards: { crystals: 10 } },
    { id: 'mob-b', yamlPath: 'encounters/tower/mob-b.yaml', kind: 'mob', scoutSummary: 'B', rewards: { crystals: 10 } },
    { id: 'mob-c', yamlPath: 'encounters/tower/mob-c.yaml', kind: 'mob', scoutSummary: 'C', rewards: { crystals: 10 } },
    { id: 'mob-retired', yamlPath: 'encounters/tower/archive/mob-retired.yaml', kind: 'mob', scoutSummary: 'R', rewards: { crystals: 5 }, deprecated: '2026-05-01' },
    { id: 'elite-fortune-trial', yamlPath: 'encounters/tower/elite-fortune-trial.yaml', kind: 'elite', scoutSummary: 'Fortune', rewards: { crystals: 35 } },
    { id: 'elite-aoe-marathon', yamlPath: 'encounters/tower/elite-aoe-marathon.yaml', kind: 'elite', scoutSummary: 'Marathon', rewards: { crystals: 35 } },
    { id: 'boss-tower-warden', yamlPath: 'encounters/tower/boss-tower-warden.yaml', kind: 'boss', scoutSummary: 'Warden', rewards: { crystals: 80 } },
    { id: 'mob-fallback', yamlPath: 'encounters/tower/mob-fallback.yaml', kind: 'mob', scoutSummary: 'fallback', rewards: { crystals: 10 }, deprecated: 'never-in-pool' },
  ] satisfies EncounterPoolEntry[],
}

beforeEach(() => {
  _resetEncounterPoolCache()
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockManifest,
  }) as any
})

describe('encounter-pool', () => {
  it('loadEncounterPool fetches and caches manifest', async () => {
    const first = await loadEncounterPool()
    const second = await loadEncounterPool()
    expect(first).toBe(second)
    expect((globalThis.fetch as any).mock.calls.length).toBe(1)
  })

  it('resolveEncounter returns found entry for live id', async () => {
    const entry = await resolveEncounter('mob-a')
    expect(entry.id).toBe('mob-a')
    expect(entry.scoutSummary).toBe('A')
  })

  it('resolveEncounter returns found entry for deprecated id (Registry walk)', async () => {
    const entry = await resolveEncounter('mob-retired')
    expect(entry.id).toBe('mob-retired')
    expect(entry.deprecated).toBe('2026-05-01')
  })

  it('resolveEncounter falls back to mob-fallback when id missing, and logs error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const entry = await resolveEncounter('mob-nonexistent')
    expect(entry.id).toBe(FALLBACK_ENCOUNTER_ID)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('pickEncounterIdFromActivePool excludes deprecated entries', async () => {
    const picked = new Set<string>()
    for (let nodeId = 0; nodeId < 100; nodeId++) {
      const id = await pickEncounterIdFromActivePool('seed-1', nodeId, 'mob')
      picked.add(id)
    }
    expect(picked.has('mob-retired')).toBe(false)
    expect(picked.has('mob-fallback')).toBe(false)
    expect(picked.has('mob-a')).toBe(true)
  })

  it('pickEncounterIdFromActivePool is deterministic for same (seed, nodeId)', async () => {
    const a = await pickEncounterIdFromActivePool('seed-X', 42, 'mob')
    const b = await pickEncounterIdFromActivePool('seed-X', 42, 'mob')
    expect(a).toBe(b)
  })

  it('pickEncounterIdFromActivePool varies by nodeId', async () => {
    const ids = new Set<string>()
    for (let i = 0; i < 20; i++) {
      ids.add(await pickEncounterIdFromActivePool('seed-vary', i, 'mob'))
    }
    expect(ids.size).toBeGreaterThan(1)
  })

  it('pickEncounterIdFromActivePool throws when kind has no active entries', async () => {
    await expect(pickEncounterIdFromActivePool('seed-1', 0, 'rare' as any)).rejects.toThrow(/active pool/i)
  })

  // T24: elite + boss pool extension
  it('resolveEncounter returns elite-fortune-trial with kind=elite and crystals=35', async () => {
    const entry = await resolveEncounter('elite-fortune-trial')
    expect(entry.id).toBe('elite-fortune-trial')
    expect(entry.kind).toBe('elite')
    expect(entry.rewards.crystals).toBe(35)
  })

  it('resolveEncounter returns boss-tower-warden with kind=boss', async () => {
    const entry = await resolveEncounter('boss-tower-warden')
    expect(entry.id).toBe('boss-tower-warden')
    expect(entry.kind).toBe('boss')
  })

  it('pickEncounterIdFromActivePool(elite) returns one of the 2 elite ids', async () => {
    const eliteIds = new Set(['elite-fortune-trial', 'elite-aoe-marathon'])
    const picked = new Set<string>()
    for (let nodeId = 0; nodeId < 50; nodeId++) {
      const id = await pickEncounterIdFromActivePool('seed-elite', nodeId, 'elite')
      expect(eliteIds.has(id)).toBe(true)
      picked.add(id)
    }
    // Both elites should appear across 50 rolls
    expect(picked.size).toBe(2)
  })

  it('pickEncounterIdFromActivePool(boss) always returns boss-tower-warden (only 1 boss)', async () => {
    for (let nodeId = 0; nodeId < 10; nodeId++) {
      const id = await pickEncounterIdFromActivePool('seed-boss', nodeId, 'boss')
      expect(id).toBe('boss-tower-warden')
    }
  })
})
