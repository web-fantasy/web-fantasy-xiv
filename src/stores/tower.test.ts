// src/stores/tower.test.ts
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useTowerStore } from '@/stores/tower'
import * as persistence from '@/tower/persistence'
import { saveTowerRun, clearTowerRun } from '@/tower/persistence'
import type { TowerRun } from '@/tower/types'
import { TOWER_RUN_SCHEMA_VERSION } from '@/tower/types'
import { TOWER_BLUEPRINT_CURRENT, TOWER_BLUEPRINT_MIN_SUPPORTED } from '@/tower/blueprint/version'

async function injectSavedRun(partial: Partial<TowerRun> = {}): Promise<void> {
  const run: TowerRun = {
    schemaVersion: TOWER_RUN_SCHEMA_VERSION,
    blueprintVersion: TOWER_BLUEPRINT_CURRENT,
    runId: 'test-run',
    seed: 'test-seed',
    graphSource: { kind: 'random' },
    startedAt: Date.now(),
    baseJobId: 'swordsman',
    towerGraph: { startNodeId: 0, bossNodeId: 13, nodes: {} },
    currentNodeId: 0,
    determination: 5,
    maxDetermination: 5,
    level: 1,
    crystals: 0,
    currentWeapon: null,
    advancedJobId: null,
    materia: [],
    activatedMateria: [],
    relics: [],
    scoutedNodes: {},
    completedNodes: [],
    ...partial,
  }
  await saveTowerRun(run)
}

describe('useTowerStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await persistence.clearTowerRun()
    vi.restoreAllMocks()
  })

  afterEach(async () => {
    await persistence.clearTowerRun()
  })

  it('startNewRun sets phase to ready-to-descend (not selecting-job)', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'test-seed')
    expect(tower.phase).toBe('ready-to-descend')
    expect(tower.run?.baseJobId).toBe('swordsman')
  })

  it('initial phase is "no-run"', () => {
    const store = useTowerStore()
    expect(store.phase).toBe('no-run')
    expect(store.run).toBeNull()
  })

  it('savedRunExists starts false', () => {
    const store = useTowerStore()
    expect(store.savedRunExists).toBe(false)
  })

  it('startNewRun mutates phase to "ready-to-descend" and creates a run', () => {
    const store = useTowerStore()
    store.startNewRun('swordsman', 'seed-xyz')
    expect(store.phase).toBe('ready-to-descend')
    expect(store.run).not.toBeNull()
    expect(store.run?.baseJobId).toBe('swordsman')
    expect(store.run?.seed).toBe('seed-xyz')
    expect(store.run?.determination).toBe(5)
    expect(store.run?.maxDetermination).toBe(5)
    expect(store.run?.level).toBe(1)
  })

  it('startNewRun without seed generates a seed string', () => {
    const store = useTowerStore()
    store.startNewRun('archer')
    expect(typeof store.run?.seed).toBe('string')
    expect(store.run?.seed.length).toBeGreaterThan(0)
  })

  it('resetRun clears run and returns phase to "no-run"', () => {
    const store = useTowerStore()
    store.startNewRun('thaumaturge')
    store.resetRun()
    expect(store.phase).toBe('no-run')
    expect(store.run).toBeNull()
  })

  it('setPhase updates phase discriminator', () => {
    const store = useTowerStore()
    store.startNewRun('swordsman')
    store.setPhase('in-path')
    expect(store.phase).toBe('in-path')
  })

  it('persists run via saveTowerRun when phase changes', async () => {
    // Use vi.mock fallback pattern to handle potential ESM read-only binding issues
    const spy = vi.spyOn(persistence, 'saveTowerRun')
    const store = useTowerStore()
    store.startNewRun('swordsman', 'persist-seed')
    // flush: 'post' means watch fires after Vue's flush cycle — wait for it
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(spy).toHaveBeenCalled()
    const lastCall = spy.mock.calls.at(-1)
    expect(lastCall?.[0].seed).toBe('persist-seed')
  })

  it('resetRun calls clearTowerRun', async () => {
    const spy = vi.spyOn(persistence, 'clearTowerRun')
    const store = useTowerStore()
    store.startNewRun('swordsman')
    store.resetRun()
    expect(spy).toHaveBeenCalled()
  })

  it('continueLastRun loads persisted run and sets phase to "in-path"', async () => {
    // Seed IndexedDB with a run that has a populated graph (nodes non-empty → in-path)
    await persistence.saveTowerRun({
      schemaVersion: TOWER_RUN_SCHEMA_VERSION,
      blueprintVersion: TOWER_BLUEPRINT_CURRENT,
      runId: 'persisted-run',
      seed: 'old-seed',
      graphSource: { kind: 'random' },
      startedAt: 1_700_000_000_000,
      baseJobId: 'archer',
      towerGraph: {
        startNodeId: 0,
        bossNodeId: 13,
        nodes: {
          0: { id: 0, step: 0, slot: 0, kind: 'start', next: [1] },
          1: { id: 1, step: 1, slot: 0, kind: 'mob', next: [] },
        },
      },
      currentNodeId: 3,
      determination: 4,
      maxDetermination: 5,
      level: 5,
      crystals: 42,
      currentWeapon: null,
      advancedJobId: null,
      materia: [],
      activatedMateria: [],
      relics: [],
      scoutedNodes: {},
      completedNodes: [0, 1, 2],
    })
    const store = useTowerStore()
    await store.continueLastRun()
    expect(store.run?.runId).toBe('persisted-run')
    expect(store.run?.crystals).toBe(42)
    expect(store.phase).toBe('in-path')
  })

  it('continueLastRun is a no-op when no saved run exists', async () => {
    const store = useTowerStore()
    await store.continueLastRun()
    expect(store.phase).toBe('no-run')
    expect(store.run).toBeNull()
  })

  it('continueLastRun does not trigger a redundant save after load', async () => {
    // Seed IndexedDB with a run first
    await persistence.saveTowerRun({
      schemaVersion: TOWER_RUN_SCHEMA_VERSION,
      blueprintVersion: TOWER_BLUEPRINT_CURRENT,
      runId: 'no-redundant-save',
      seed: 'seed',
      graphSource: { kind: 'random' },
      startedAt: 0,
      baseJobId: 'swordsman',
      towerGraph: { startNodeId: 0, bossNodeId: 13, nodes: {} },
      currentNodeId: 0,
      determination: 5,
      maxDetermination: 5,
      level: 1,
      crystals: 0,
      currentWeapon: null,
      advancedJobId: null,
      materia: [],
      activatedMateria: [],
      relics: [],
      scoutedNodes: {},
      completedNodes: [],
    })
    const store = useTowerStore()
    const spy = vi.spyOn(persistence, 'saveTowerRun')
    await store.continueLastRun()
    // Let Vue's flush:post watchers fire
    await nextTick()
    await nextTick()
    // The 'no-run' → 'in-path' transition caused by load must NOT trigger
    // a write-back — suppressPersist should cover the whole flush cycle.
    expect(spy).not.toHaveBeenCalled()
  })

  it('hydrate() updates savedRunExists from IndexedDB', async () => {
    await persistence.saveTowerRun({
      schemaVersion: TOWER_RUN_SCHEMA_VERSION,
      blueprintVersion: TOWER_BLUEPRINT_CURRENT,
      runId: 'hydrate-check',
      seed: 's',
      graphSource: { kind: 'random' },
      startedAt: 0,
      baseJobId: 'swordsman',
      towerGraph: { startNodeId: 0, bossNodeId: 13, nodes: {} },
      currentNodeId: 0,
      determination: 5,
      maxDetermination: 5,
      level: 1,
      crystals: 0,
      currentWeapon: null,
      advancedJobId: null,
      materia: [],
      activatedMateria: [],
      relics: [],
      scoutedNodes: {},
      completedNodes: [],
    })
    const store = useTowerStore()
    await store.hydrate()
    expect(store.savedRunExists).toBe(true)
  })

  // ------------------------------------------------------------
  // Phase 2: startDescent
  // ------------------------------------------------------------
  describe('startDescent', () => {
    it('generates graph and transitions to in-path when in ready-to-descend', async () => {
      const store = useTowerStore()
      store.startNewRun('swordsman', 'descent-seed-1')
      expect(store.phase).toBe('ready-to-descend')
      await store.startDescent()
      expect(store.phase).toBe('in-path')
      expect(Object.keys(store.run!.towerGraph.nodes).length).toBeGreaterThan(0)
      expect(store.run!.currentNodeId).toBe(store.run!.towerGraph.startNodeId)
    })

    it('is deterministic: two runs with same seed produce equal graphs', async () => {
      setActivePinia(createPinia())
      const a = useTowerStore()
      a.startNewRun('swordsman', 'equal-seed')
      await a.startDescent()
      const graphA = a.run!.towerGraph

      setActivePinia(createPinia())
      const b = useTowerStore()
      b.startNewRun('archer', 'equal-seed') // 不同 job, 同 seed
      await b.startDescent()
      const graphB = b.run!.towerGraph

      expect(graphA).toEqual(graphB)
    })

    it('no-op + warn when called without active run', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const store = useTowerStore()
      await store.startDescent()
      expect(store.phase).toBe('no-run')
      expect(warn).toHaveBeenCalled()
    })

    it('no-op + warn when called in wrong phase', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const store = useTowerStore()
      store.startNewRun('swordsman')
      store.setPhase('in-path')
      await store.startDescent()
      expect(warn).toHaveBeenCalled()
    })
  })

  // ------------------------------------------------------------
  // Phase 2: advanceTo
  // ------------------------------------------------------------
  describe('advanceTo', () => {
    it('advances currentNodeId to a legal next node and marks prev completed', async () => {
      const store = useTowerStore()
      store.startNewRun('swordsman', 'adv-seed-1')
      await store.startDescent()
      const start = store.run!.towerGraph.nodes[store.run!.currentNodeId]
      const legalNext = start.next[0]
      store.advanceTo(legalNext)
      expect(store.run!.currentNodeId).toBe(legalNext)
      expect(store.run!.completedNodes).toContain(start.id)
    })

    it('no-op + warn on illegal next node id', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const store = useTowerStore()
      store.startNewRun('swordsman', 'adv-seed-2')
      await store.startDescent()
      const prevId = store.run!.currentNodeId
      store.advanceTo(99999) // 不在 next 列表中
      expect(store.run!.currentNodeId).toBe(prevId)
      expect(warn).toHaveBeenCalled()
    })

    it('no-op + warn without active run', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const store = useTowerStore()
      store.advanceTo(0)
      expect(warn).toHaveBeenCalled()
    })

    it('no-op + warn in wrong phase', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const store = useTowerStore()
      store.startNewRun('swordsman')
      // phase 此时 = 'ready-to-descend'
      store.advanceTo(0)
      expect(warn).toHaveBeenCalled()
    })

    it('triggers a persistence save', async () => {
      const spy = vi.spyOn(persistence, 'saveTowerRun')
      const store = useTowerStore()
      store.startNewRun('swordsman', 'adv-seed-3')
      await store.startDescent()
      spy.mockClear() // 清掉 phase 变更引发的 save
      const start = store.run!.towerGraph.nodes[store.run!.currentNodeId]
      const legalNext = start.next[0]
      store.advanceTo(legalNext)
      expect(spy).toHaveBeenCalled()
    })
  })

  // ------------------------------------------------------------
  // Phase 2: schema version check + schemaResetNotice
  // ------------------------------------------------------------
  describe('schema version', () => {
    it('continueLastRun resets run + sets notice when schemaVersion mismatches', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      // Save an "old" run with schemaVersion 0
      await persistence.saveTowerRun({
        schemaVersion: 0, // 不等于 TOWER_RUN_SCHEMA_VERSION
        blueprintVersion: TOWER_BLUEPRINT_CURRENT,
        runId: 'old-run',
        seed: 'x',
        graphSource: { kind: 'random' },
        startedAt: 0,
        baseJobId: 'swordsman',
        towerGraph: { startNodeId: 0, bossNodeId: 13, nodes: {} },
        currentNodeId: 0,
        determination: 5,
        maxDetermination: 5,
        level: 1,
        crystals: 0,
        currentWeapon: null,
        advancedJobId: null,
        materia: [],
        activatedMateria: [],
        relics: [],
        scoutedNodes: {},
        completedNodes: [],
      })
      const store = useTowerStore()
      await store.continueLastRun()
      expect(store.phase).toBe('no-run')
      expect(store.run).toBeNull()
      expect(store.schemaResetNotice).toBe(true)
      expect(warn).toHaveBeenCalled()
    })

    it('continueLastRun hydrates normally when schemaVersion matches', async () => {
      // nodes is empty → phase inferred as ready-to-descend
      await persistence.saveTowerRun({
        schemaVersion: TOWER_RUN_SCHEMA_VERSION,
        blueprintVersion: TOWER_BLUEPRINT_CURRENT,
        runId: 'current-run',
        seed: 'x',
        graphSource: { kind: 'random' },
        startedAt: 0,
        baseJobId: 'swordsman',
        towerGraph: { startNodeId: 0, bossNodeId: 13, nodes: {} },
        currentNodeId: 0,
        determination: 5,
        maxDetermination: 5,
        level: 1,
        crystals: 0,
        currentWeapon: null,
        advancedJobId: null,
        materia: [],
        activatedMateria: [],
        relics: [],
        scoutedNodes: {},
        completedNodes: [],
      })
      const store = useTowerStore()
      await store.continueLastRun()
      expect(store.phase).toBe('ready-to-descend')
      expect(store.run?.runId).toBe('current-run')
      expect(store.schemaResetNotice).toBe(false)
    })

    it('dismissSchemaNotice clears the notice flag', () => {
      const store = useTowerStore()
      // Manually raise notice by direct ref access is not possible; use continueLastRun path
      // or a simpler approach: just call dismiss after it's set.
      // Here we rely on the previous test's state semantics, so we set it manually:
      ;(store as unknown as { schemaResetNotice: { value: boolean } })
        // ignore; test pattern below is cleaner
      store.schemaResetNotice = true // Pinia setup stores expose refs as writable
      expect(store.schemaResetNotice).toBe(true)
      store.dismissSchemaNotice()
      expect(store.schemaResetNotice).toBe(false)
    })

    it('startNewRun clears schemaResetNotice', () => {
      const store = useTowerStore()
      // simulate notice being set
      store.schemaResetNotice = true
      expect(store.schemaResetNotice).toBe(true)
      store.startNewRun('swordsman')
      expect(store.schemaResetNotice).toBe(false)
    })
  })

  // ------------------------------------------------------------
  // Phase 3: enterJobPicker
  // ------------------------------------------------------------
  it('enterJobPicker sets phase to selecting-job without creating a run', () => {
    const tower = useTowerStore()
    tower.enterJobPicker()
    expect(tower.phase).toBe('selecting-job')
    expect(tower.run).toBeNull()
    expect(tower.savedRunExists).toBe(false)
  })
})

describe('useTowerStore.hydrate', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await clearTowerRun()
  })

  it('hydrate loads run data into run.value when schema matches, phase stays no-run', async () => {
    await injectSavedRun({ level: 4, crystals: 127 })
    const tower = useTowerStore()
    await tower.hydrate()
    expect(tower.phase).toBe('no-run')
    expect(tower.savedRunExists).toBe(true)
    expect(tower.run?.level).toBe(4)
    expect(tower.run?.crystals).toBe(127)
  })

  it('hydrate leaves run null when no save exists', async () => {
    const tower = useTowerStore()
    await tower.hydrate()
    expect(tower.savedRunExists).toBe(false)
    expect(tower.run).toBeNull()
  })

  it('continueLastRun infers ready-to-descend when graph.nodes is empty', async () => {
    await injectSavedRun({ towerGraph: { startNodeId: 0, bossNodeId: 13, nodes: {} } })
    const tower = useTowerStore()
    await tower.hydrate()
    await tower.continueLastRun()
    expect(tower.phase).toBe('ready-to-descend')
  })

  it('continueLastRun infers in-path when graph.nodes is populated', async () => {
    await injectSavedRun({
      towerGraph: {
        startNodeId: 0,
        bossNodeId: 13,
        nodes: {
          0: { id: 0, step: 0, slot: 0, kind: 'start', next: [1] },
          1: { id: 1, step: 1, slot: 0, kind: 'mob', next: [] },
        },
      },
    })
    const tower = useTowerStore()
    await tower.hydrate()
    await tower.continueLastRun()
    expect(tower.phase).toBe('in-path')
  })

  it('hydrate resets phase to no-run even when a prior in-path phase exists in session', async () => {
    await injectSavedRun({ towerGraph: { startNodeId: 0, bossNodeId: 13, nodes: { 0: { id: 0, step: 0, slot: 0, kind: 'start', next: [1] } } } })
    const tower = useTowerStore()
    // Simulate session-state where phase advanced earlier
    tower.setPhase('in-path')
    expect(tower.phase).toBe('in-path')
    await tower.hydrate()
    expect(tower.phase).toBe('no-run')
  })
})

describe('tower store — startDescent crystallization', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await clearTowerRun()
    vi.restoreAllMocks()
    const { _resetEncounterPoolCache } = await import('@/tower/pools/encounter-pool')
    _resetEncounterPoolCache()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        manifestVersion: 1,
        entries: [
          { id: 'mob-a', yamlPath: 'encounters/tower/mob-a.yaml', kind: 'mob', scoutSummary: 'A', rewards: { crystals: 10 } },
          { id: 'mob-b', yamlPath: 'encounters/tower/mob-b.yaml', kind: 'mob', scoutSummary: 'B', rewards: { crystals: 10 } },
          { id: 'mob-fallback', yamlPath: 'encounters/tower/mob-fallback.yaml', kind: 'mob', scoutSummary: 'fb', rewards: { crystals: 10 }, deprecated: 'never-in-pool' },
        ],
      }),
    }) as any
  })

  it('fills encounterId on all mob nodes after startDescent', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'test-seed-1')
    await tower.startDescent()
    const mobNodes = Object.values(tower.run!.towerGraph.nodes).filter((n) => n.kind === 'mob')
    expect(mobNodes.length).toBeGreaterThan(0)
    for (const n of mobNodes) {
      expect(n.encounterId).toBeDefined()
      expect(['mob-a', 'mob-b']).toContain(n.encounterId)
    }
  })

  it('does not fill encounterId on non-battle nodes', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'test-seed-2')
    await tower.startDescent()
    const nonBattle = Object.values(tower.run!.towerGraph.nodes).filter(
      (n) => n.kind === 'reward' || n.kind === 'campfire' || n.kind === 'event' || n.kind === 'start',
    )
    for (const n of nonBattle) {
      expect(n.encounterId).toBeUndefined()
    }
  })

  it('same seed produces same encounterId assignments', async () => {
    setActivePinia(createPinia())
    const tower1 = useTowerStore()
    tower1.startNewRun('swordsman', 'repro-seed')
    await tower1.startDescent()
    const ids1 = Object.values(tower1.run!.towerGraph.nodes)
      .filter((n) => n.kind === 'mob')
      .map((n) => `${n.id}:${n.encounterId}`)
      .sort()

    setActivePinia(createPinia())
    const tower2 = useTowerStore()
    tower2.startNewRun('swordsman', 'repro-seed')
    await tower2.startDescent()
    const ids2 = Object.values(tower2.run!.towerGraph.nodes)
      .filter((n) => n.kind === 'mob')
      .map((n) => `${n.id}:${n.encounterId}`)
      .sort()

    expect(ids1).toEqual(ids2)
  })
})

describe('tower store — blueprint version', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await clearTowerRun()
    vi.restoreAllMocks()
  })

  it('startNewRun initializes run.blueprintVersion to CURRENT', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman')
    expect(tower.run?.blueprintVersion).toBe(TOWER_BLUEPRINT_CURRENT)
  })

  it('continueLastRun accepts blueprintVersion in range [MIN_SUPPORTED, CURRENT]', async () => {
    const mockRun: TowerRun = {
      schemaVersion: TOWER_RUN_SCHEMA_VERSION,
      blueprintVersion: TOWER_BLUEPRINT_CURRENT,
      runId: 'r1',
      seed: 's1',
      graphSource: { kind: 'random' },
      startedAt: Date.now(),
      baseJobId: 'swordsman',
      towerGraph: { startNodeId: 0, bossNodeId: 13, nodes: {} },
      currentNodeId: 0,
      determination: 5,
      maxDetermination: 5,
      level: 1,
      crystals: 0,
      currentWeapon: null,
      advancedJobId: null,
      materia: [],
      activatedMateria: [],
      relics: [],
      scoutedNodes: {},
      completedNodes: [],
    }
    vi.spyOn(persistence, 'loadTowerRun').mockResolvedValue(mockRun)
    const tower = useTowerStore()
    await tower.continueLastRun()
    expect(tower.run).not.toBeNull()
    expect(tower.phase).toBe('ready-to-descend')
  })

  it('continueLastRun resets when blueprintVersion < MIN_SUPPORTED', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mockRun: TowerRun = {
      schemaVersion: TOWER_RUN_SCHEMA_VERSION,
      blueprintVersion: TOWER_BLUEPRINT_MIN_SUPPORTED - 1,
      runId: 'r1',
      seed: 's1',
      graphSource: { kind: 'random' },
      startedAt: Date.now(),
      baseJobId: 'swordsman',
      towerGraph: { startNodeId: 0, bossNodeId: 13, nodes: {} },
      currentNodeId: 0,
      determination: 5,
      maxDetermination: 5,
      level: 1,
      crystals: 0,
      currentWeapon: null,
      advancedJobId: null,
      materia: [],
      activatedMateria: [],
      relics: [],
      scoutedNodes: {},
      completedNodes: [],
    }
    vi.spyOn(persistence, 'loadTowerRun').mockResolvedValue(mockRun)
    const tower = useTowerStore()
    await tower.continueLastRun()
    expect(tower.run).toBeNull()
    expect(tower.phase).toBe('no-run')
    expect(tower.schemaResetNotice).toBe(true)
    expect(warn).toHaveBeenCalled()
  })

  it('continueLastRun resets when blueprintVersion > CURRENT (defensive)', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mockRun: TowerRun = {
      schemaVersion: TOWER_RUN_SCHEMA_VERSION,
      blueprintVersion: 999,
      runId: 'r1',
      seed: 's1',
      graphSource: { kind: 'random' },
      startedAt: Date.now(),
      baseJobId: 'swordsman',
      towerGraph: { startNodeId: 0, bossNodeId: 13, nodes: {} },
      currentNodeId: 0,
      determination: 5,
      maxDetermination: 5,
      level: 1,
      crystals: 0,
      currentWeapon: null,
      advancedJobId: null,
      materia: [],
      activatedMateria: [],
      relics: [],
      scoutedNodes: {},
      completedNodes: [],
    }
    vi.spyOn(persistence, 'loadTowerRun').mockResolvedValue(mockRun)
    const tower = useTowerStore()
    await tower.continueLastRun()
    expect(tower.run).toBeNull()
    expect(tower.phase).toBe('no-run')
    expect(tower.schemaResetNotice).toBe(true)
    expect(err).toHaveBeenCalled()
  })
})

describe('tower store — scoutNode', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await clearTowerRun()
    vi.restoreAllMocks()
    const { _resetEncounterPoolCache } = await import('@/tower/pools/encounter-pool')
    _resetEncounterPoolCache()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        manifestVersion: 1,
        entries: [
          { id: 'mob-a', yamlPath: 'encounters/tower/mob-a.yaml', kind: 'mob', scoutSummary: 'A summary', rewards: { crystals: 10 } },
          { id: 'mob-b', yamlPath: 'encounters/tower/mob-b.yaml', kind: 'mob', scoutSummary: 'B summary', rewards: { crystals: 10 } },
          { id: 'mob-fallback', yamlPath: 'encounters/tower/mob-fallback.yaml', kind: 'mob', scoutSummary: 'fb', rewards: { crystals: 10 }, deprecated: 'never-in-pool' },
        ],
      }),
    }) as any
  })

  it('scoutNode deducts 1 crystal and caches scoutInfo', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'scout-test')
    await tower.startDescent()
    tower.run!.crystals = 5
    const mobNode = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'mob')!
    const success = await tower.scoutNode(mobNode.id)
    expect(success).toBe(true)
    expect(tower.run!.crystals).toBe(4)
    expect(tower.run!.scoutedNodes[mobNode.id]).toBeDefined()
    expect(tower.run!.scoutedNodes[mobNode.id].enemySummary).toBeTruthy()
  })

  it('scoutNode returns false when crystals insufficient', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'scout-poor')
    await tower.startDescent()
    tower.run!.crystals = 0
    const mobNode = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'mob')!
    const success = await tower.scoutNode(mobNode.id)
    expect(success).toBe(false)
    expect(tower.run!.scoutedNodes[mobNode.id]).toBeUndefined()
  })

  it('scoutNode is idempotent — re-scouting does not re-deduct', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'scout-idem')
    await tower.startDescent()
    tower.run!.crystals = 5
    const mobNode = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'mob')!
    await tower.scoutNode(mobNode.id)
    await tower.scoutNode(mobNode.id)
    expect(tower.run!.crystals).toBe(4)
  })
})

describe('tower store — enterCombat', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await clearTowerRun()
    vi.restoreAllMocks()
    const { _resetEncounterPoolCache } = await import('@/tower/pools/encounter-pool')
    _resetEncounterPoolCache()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        manifestVersion: 1,
        entries: [
          { id: 'mob-a', yamlPath: 'encounters/tower/mob-a.yaml', kind: 'mob', scoutSummary: 'A', rewards: { crystals: 10 } },
          { id: 'elite-a', yamlPath: 'encounters/tower/elite-a.yaml', kind: 'elite', scoutSummary: 'E', rewards: { crystals: 35 } },
          { id: 'boss-a', yamlPath: 'encounters/tower/boss-a.yaml', kind: 'boss', scoutSummary: 'B', rewards: { crystals: 80 } },
          { id: 'mob-fallback', yamlPath: 'encounters/tower/mob-fallback.yaml', kind: 'mob', scoutSummary: 'fb', rewards: { crystals: 10 }, deprecated: 'never-in-pool' },
        ],
      }),
    }) as any
  })

  it('enterCombat on a mob node switches phase to in-combat', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'ec-1')
    await tower.startDescent()
    const mobNode = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'mob')
    if (!mobNode) return // skip if no mob node in this seed
    tower.run!.currentNodeId = mobNode.id // force onto node for test
    tower.enterCombat(mobNode.id)
    expect(tower.phase).toBe('in-combat')
  })

  it('enterCombat on non-battle node is a no-op', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'ec-2')
    await tower.startDescent()
    const rewardNode = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'reward')
    if (!rewardNode) return
    tower.run!.currentNodeId = rewardNode.id
    tower.enterCombat(rewardNode.id)
    expect(tower.phase).not.toBe('in-combat')
  })

  it('enterCombat on elite enters combat (phase 5)', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'ec-3')
    await tower.startDescent()
    const elite = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'elite')
    if (!elite) return
    tower.run!.currentNodeId = elite.id
    tower.enterCombat(elite.id)
    expect(tower.phase).toBe('in-combat')
  })

  it('enterCombat on boss enters combat (phase 5)', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'ec-4')
    await tower.startDescent()
    const boss = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'boss')
    if (!boss) return
    tower.run!.currentNodeId = boss.id
    tower.enterCombat(boss.id)
    expect(tower.phase).toBe('in-combat')
  })

  it('enterCombat does NOT change currentNodeId (player stays on previous node)', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'ec-no-move')
    await tower.startDescent()
    const mobNode = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'mob')
    if (!mobNode) return
    const before = tower.run!.currentNodeId
    tower.enterCombat(mobNode.id)
    expect(tower.run!.currentNodeId).toBe(before) // unchanged
  })
})

describe('tower store — combat outcome actions', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await clearTowerRun()
    vi.restoreAllMocks()
    const { _resetEncounterPoolCache } = await import('@/tower/pools/encounter-pool')
    _resetEncounterPoolCache()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        manifestVersion: 1,
        entries: [
          { id: 'mob-a', yamlPath: 'encounters/tower/mob-a.yaml', kind: 'mob', scoutSummary: 'A', rewards: { crystals: 10 } },
          { id: 'mob-fallback', yamlPath: 'encounters/tower/mob-fallback.yaml', kind: 'mob', scoutSummary: 'fb', rewards: { crystals: 10 }, deprecated: 'never-in-pool' },
        ],
      }),
    }) as any
  })

  it('resolveVictory marks completed + adds crystals + returns to in-path', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'rv-1')
    await tower.startDescent()
    const mobNode = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'mob')!
    tower.run!.currentNodeId = mobNode.id
    tower.enterCombat(mobNode.id)
    expect(tower.phase).toBe('in-combat')
    const crystalsBefore = tower.run!.crystals
    tower.resolveVictory(mobNode.id, 10)
    expect(tower.run!.crystals).toBe(crystalsBefore + 10)
    expect(tower.run!.completedNodes).toContain(mobNode.id)
    expect(tower.phase).toBe('in-path')
  })

  it('onCombatWipe(mob) subtracts -1 from run.determination', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'dd-1')
    expect(tower.run!.determination).toBe(5)
    tower.onCombatWipe('mob', 'mob-a')
    expect(tower.run!.determination).toBe(4)
  })

  it('onCombatWipe clamps to 0 (does not go below 0)', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'dd-2')
    tower.run!.determination = 1
    // boss wipe is -2; from 1 it should clamp to 0 rather than -1
    tower.onCombatWipe('boss', 'boss-x')
    expect(tower.run!.determination).toBe(0)
  })
})

describe('tower store — abandon + checkEnded', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await clearTowerRun()
    vi.restoreAllMocks()
    const { _resetEncounterPoolCache } = await import('@/tower/pools/encounter-pool')
    _resetEncounterPoolCache()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        manifestVersion: 1,
        entries: [
          { id: 'mob-a', yamlPath: 'encounters/tower/mob-a.yaml', kind: 'mob', scoutSummary: 'A', rewards: { crystals: 10 } },
          { id: 'mob-fallback', yamlPath: 'encounters/tower/mob-fallback.yaml', kind: 'mob', scoutSummary: 'fb', rewards: { crystals: 10 }, deprecated: 'never-in-pool' },
        ],
      }),
    }) as any
  })

  it('abandonCurrentCombat gives 50% crystals + marks completed + returns in-path', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'ab-1')
    await tower.startDescent()
    const mobNode = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'mob')!
    tower.run!.currentNodeId = mobNode.id
    tower.run!.crystals = 0
    tower.enterCombat(mobNode.id)
    tower.abandonCurrentCombat(mobNode.id, 10) // full reward 10 → floor(10/2) = 5
    expect(tower.run!.crystals).toBe(5)
    expect(tower.run!.completedNodes).toContain(mobNode.id)
    expect(tower.phase).toBe('in-path')
  })

  it('checkEndedCondition flips phase to ended when determination <= 0', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'ce-1')
    tower.run!.determination = 0
    tower.checkEndedCondition()
    expect(tower.phase).toBe('ended')
  })

  it('checkEndedCondition is no-op when determination > 0', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'ce-2')
    tower.run!.determination = 1
    tower.checkEndedCondition()
    expect(tower.phase).not.toBe('ended')
  })
})

describe('tower store — changeDetermination interceptor', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await clearTowerRun()
    vi.restoreAllMocks()
  })

  it('empty interceptors: pass-through apply', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'cd-1')
    // startNewRun seeds determination: 5, maxDetermination: 5
    const r = tower.changeDetermination({ source: 'mob-wipe', delta: -1 })
    expect(r).toEqual({ delta: -1, cancelled: false })
    expect(tower.run!.determination).toBe(4)
  })

  it('clamps to [0, maxDetermination]', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'cd-clamp-upper')
    // determination: 5, max: 5 — attempt to add more than max
    tower.changeDetermination({ source: 'event', delta: +3 })
    expect(tower.run!.determination).toBe(5) // upper clamp

    // Set determination: 1, max: 5 — attempt to subtract more than floor
    tower.run!.determination = 1
    tower.changeDetermination({ source: 'boss-wipe', delta: -5 })
    expect(tower.run!.determination).toBe(0) // lower clamp
  })

  it('single interceptor modifies delta', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'cd-single')
    tower.interceptors.push((_intent, current) => ({
      ...current,
      delta: current.delta * 2,
    }))
    tower.changeDetermination({ source: 'mob-wipe', delta: -1 })
    expect(tower.run!.determination).toBe(3) // 5 + (-1 * 2) = 3
  })

  it('interceptor cancels → determination unchanged', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'cd-cancel')
    tower.interceptors.push(() => ({
      delta: 0,
      cancelled: true,
      cancelReason: '无敌光环',
    }))
    const r = tower.changeDetermination({ source: 'mob-wipe', delta: -1 })
    expect(r.cancelled).toBe(true)
    expect(r.cancelReason).toBe('无敌光环')
    expect(tower.run!.determination).toBe(5)
  })

  it('multi interceptor chain order + cancel terminates chain', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'cd-chain')
    const log: string[] = []
    tower.interceptors.push((_intent, cur) => {
      log.push('a')
      return cur
    })
    tower.interceptors.push((_intent, _cur) => {
      log.push('b')
      return { delta: 0, cancelled: true, cancelReason: 'stop' }
    })
    tower.interceptors.push((_intent, cur) => {
      log.push('c')
      return cur
    })
    tower.changeDetermination({ source: 'mob-wipe', delta: -1 })
    expect(log).toEqual(['a', 'b']) // c never called
  })

  it('no-op (does not throw) when called with no active run', () => {
    const tower = useTowerStore()
    // Do NOT call startNewRun — run.value stays null
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => tower.changeDetermination({ source: 'mob-wipe', delta: -1 })).not.toThrow()
    expect(tower.run).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no active run'))
    warnSpy.mockRestore()
  })
})

describe('tower store — onCombatWipe', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await clearTowerRun()
    vi.restoreAllMocks()
  })

  it('mob wipe deducts -1 via changeDetermination', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'seed-t10-mob')
    expect(tower.run!.determination).toBe(5)
    const r = tower.onCombatWipe('mob', 'mob-frost-sprite')
    expect(r).toEqual({ delta: -1, cancelled: false })
    expect(tower.run!.determination).toBe(4)
  })

  it('elite wipe deducts -1', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'seed-t10-elite')
    tower.onCombatWipe('elite', 'elite-fortune-trial')
    expect(tower.run!.determination).toBe(4)
  })

  it('boss wipe deducts -2', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'seed-t10-boss')
    tower.onCombatWipe('boss', 'boss-tower-warden')
    expect(tower.run!.determination).toBe(3)
  })

  it('respects interceptor cancel', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'seed-t10-cancel')
    tower.interceptors.push(() => ({ delta: 0, cancelled: true, cancelReason: 'divine' }))
    const r = tower.onCombatWipe('boss', 'boss-x')
    expect(r.cancelled).toBe(true)
    expect(r.cancelReason).toBe('divine')
    expect(tower.run!.determination).toBe(5) // unchanged
  })

  it('routes source tag by kind (mob→mob-wipe, elite→elite-wipe, boss→boss-wipe)', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'seed-t10-source')
    const seen: string[] = []
    tower.interceptors.push((intent, current) => {
      seen.push(intent.source)
      return current
    })
    tower.onCombatWipe('mob', 'e-1')
    tower.onCombatWipe('elite', 'e-2')
    tower.onCombatWipe('boss', 'e-3')
    expect(seen).toEqual(['mob-wipe', 'elite-wipe', 'boss-wipe'])
  })
})

describe('tower store — applyEventOutcome', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await clearTowerRun()
    vi.restoreAllMocks()
  })

  it('crystals outcome adds delta', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'seed-t11-crystals-add')
    const initial = tower.run!.crystals
    tower.applyEventOutcome({ kind: 'crystals', delta: 5 })
    expect(tower.run!.crystals).toBe(initial + 5)
  })

  it('crystals outcome negative delta clamps to 0', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'seed-t11-crystals-clamp')
    tower.run!.crystals = 3
    tower.applyEventOutcome({ kind: 'crystals', delta: -10 })
    expect(tower.run!.crystals).toBe(0)
  })

  it('determination outcome routes through changeDetermination with source=event', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'seed-t11-det')
    tower.run!.determination = 2
    const sources: string[] = []
    tower.interceptors.push((intent, cur) => {
      sources.push(intent.source)
      return cur
    })
    tower.applyEventOutcome({ kind: 'determination', delta: 1 })
    expect(sources).toEqual(['event'])
    expect(tower.run!.determination).toBe(3)
  })

  it('determination outcome respects interceptor cancel', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'seed-t11-det-cancel')
    tower.run!.determination = 3
    tower.interceptors.push(() => ({ delta: 0, cancelled: true, cancelReason: 'blocked' }))
    tower.applyEventOutcome({ kind: 'determination', delta: -1 })
    expect(tower.run!.determination).toBe(3) // unchanged
  })

  it('no-op gracefully when run is null', () => {
    const tower = useTowerStore()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => tower.applyEventOutcome({ kind: 'crystals', delta: 5 })).not.toThrow()
    expect(tower.run).toBeNull()
    warnSpy.mockRestore()
  })
})

describe('tower store — startDescent event node crystallization', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await clearTowerRun()
    vi.restoreAllMocks()
    const { _resetEncounterPoolCache } = await import('@/tower/pools/encounter-pool')
    const { _resetEventPoolCache } = await import('@/tower/pools/event-pool')
    _resetEncounterPoolCache()
    _resetEventPoolCache()
    // URL-aware mock: serve encounter-pool.json and event-pool.json separately.
    globalThis.fetch = vi.fn((url: string) => {
      const href = typeof url === 'string' ? url : String(url)
      if (href.includes('event-pool.json')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            manifestVersion: 1,
            entries: [
              { id: 'healing-oasis', yamlPath: 'tower/events/healing-oasis.yaml' },
              { id: 'pilgrim-trade', yamlPath: 'tower/events/pilgrim-trade.yaml' },
              { id: 'battle-trap', yamlPath: 'tower/events/battle-trap.yaml' },
              { id: 'training-dummy', yamlPath: 'tower/events/training-dummy.yaml' },
              { id: 'mystic-stele', yamlPath: 'tower/events/mystic-stele.yaml' },
              { id: 'event-fallback', yamlPath: 'tower/events/event-fallback.yaml', deprecated: 'never-in-pool' },
            ],
          }),
        }) as any
      }
      // default: encounter-pool.json
      return Promise.resolve({
        ok: true,
        json: async () => ({
          manifestVersion: 1,
          entries: [
            { id: 'mob-a', yamlPath: 'encounters/tower/mob-a.yaml', kind: 'mob', scoutSummary: 'A', rewards: { crystals: 10 } },
            { id: 'mob-b', yamlPath: 'encounters/tower/mob-b.yaml', kind: 'mob', scoutSummary: 'B', rewards: { crystals: 10 } },
            { id: 'mob-fallback', yamlPath: 'encounters/tower/mob-fallback.yaml', kind: 'mob', scoutSummary: 'fb', rewards: { crystals: 10 }, deprecated: 'never-in-pool' },
          ],
        }),
      }) as any
    }) as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fills eventId on each event-kind node after startDescent', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'seed-t12')
    await tower.startDescent()

    const eventNodes = Object.values(tower.run!.towerGraph.nodes).filter((n) => n.kind === 'event')

    expect(eventNodes.length).toBeGreaterThan(0) // graph should contain events
    for (const n of eventNodes) {
      expect(typeof n.eventId).toBe('string')
      expect(n.eventId!.length).toBeGreaterThan(0)
    }
  })

  it('non-event nodes have eventId undefined', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'seed-t12-b')
    await tower.startDescent()

    const nonEventNodes = Object.values(tower.run!.towerGraph.nodes).filter((n) => n.kind !== 'event')

    for (const n of nonEventNodes) {
      expect(n.eventId).toBeUndefined()
    }
  })

  it('eventId crystallization is deterministic by seed', async () => {
    const tower1 = useTowerStore()
    tower1.startNewRun('swordsman', 'seed-deterministic')
    await tower1.startDescent()
    const eventIds1 = Object.values(tower1.run!.towerGraph.nodes)
      .filter((n) => n.kind === 'event')
      .map((n) => n.eventId)

    // Fresh pinia for second run — reset pool caches too so re-fetch is clean
    setActivePinia(createPinia())
    const { _resetEventPoolCache } = await import('@/tower/pools/event-pool')
    _resetEventPoolCache()
    const tower2 = useTowerStore()
    tower2.startNewRun('swordsman', 'seed-deterministic')
    await tower2.startDescent()
    const eventIds2 = Object.values(tower2.run!.towerGraph.nodes)
      .filter((n) => n.kind === 'event')
      .map((n) => n.eventId)

    expect(eventIds1.length).toBeGreaterThan(0)
    expect(eventIds1.every((id) => typeof id === 'string' && id.length > 0)).toBe(true)
    expect(eventIds1).toEqual(eventIds2)
  })
})

describe('tower store — abandonBossRun', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await clearTowerRun()
    vi.restoreAllMocks()
    const { _resetEncounterPoolCache } = await import('@/tower/pools/encounter-pool')
    _resetEncounterPoolCache()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        manifestVersion: 1,
        entries: [
          { id: 'mob-a', yamlPath: 'encounters/tower/mob-a.yaml', kind: 'mob', scoutSummary: 'A', rewards: { crystals: 10 } },
          { id: 'mob-fallback', yamlPath: 'encounters/tower/mob-fallback.yaml', kind: 'mob', scoutSummary: 'fb', rewards: { crystals: 10 }, deprecated: 'never-in-pool' },
        ],
      }),
    }) as any
  })

  it('clears pendingCombatNodeId + sets phase ended + persists', async () => {
    const tower = useTowerStore()
    await tower.startNewRun('swordsman', 'seed-abandon-boss')
    await tower.startDescent()
    // Simulate entering a boss combat
    tower.run!.pendingCombatNodeId = tower.run!.towerGraph.bossNodeId
    const saveSpy = vi.spyOn(persistence, 'saveTowerRun')
    await tower.abandonBossRun()
    expect(tower.run!.pendingCombatNodeId).toBeNull()
    expect(tower.phase).toBe('ended')
    expect(saveSpy).toHaveBeenCalled()
  })

  it('no-op + warn when no active run', () => {
    const tower = useTowerStore()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    tower.abandonBossRun()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no active run'))
    warnSpy.mockRestore()
  })
})

describe('tower store — pendingCombatNodeId lock', () => {
  beforeEach(async () => {
    const { _resetEncounterPoolCache } = await import('@/tower/pools/encounter-pool')
    _resetEncounterPoolCache()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        manifestVersion: 1,
        entries: [
          { id: 'mob-a', yamlPath: 'encounters/tower/mob-a.yaml', kind: 'mob', scoutSummary: 'A', rewards: { crystals: 10 } },
          { id: 'mob-fallback', yamlPath: 'encounters/tower/mob-fallback.yaml', kind: 'mob', scoutSummary: 'fb', rewards: { crystals: 10 }, deprecated: 'never-in-pool' },
        ],
      }),
    }) as any
    setActivePinia(createPinia())
    await clearTowerRun()
  })

  it('startNewRun initializes pendingCombatNodeId to null', () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'pending-init')
    expect(tower.run!.pendingCombatNodeId).toBeNull()
  })

  it('enterCombat sets pendingCombatNodeId', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'pending-set')
    await tower.startDescent()
    const mobNode = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'mob')
    if (!mobNode) return
    tower.enterCombat(mobNode.id)
    expect(tower.run!.pendingCombatNodeId).toBe(mobNode.id)
  })

  it('resolveVictory clears pendingCombatNodeId', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'pending-clear-v')
    await tower.startDescent()
    const mobNode = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'mob')
    if (!mobNode) return
    tower.enterCombat(mobNode.id)
    expect(tower.run!.pendingCombatNodeId).toBe(mobNode.id)
    tower.resolveVictory(mobNode.id, 10)
    expect(tower.run!.pendingCombatNodeId).toBeNull()
  })

  it('abandonCurrentCombat clears pendingCombatNodeId', async () => {
    const tower = useTowerStore()
    tower.startNewRun('swordsman', 'pending-clear-a')
    await tower.startDescent()
    const mobNode = Object.values(tower.run!.towerGraph.nodes).find((n) => n.kind === 'mob')
    if (!mobNode) return
    tower.enterCombat(mobNode.id)
    tower.abandonCurrentCombat(mobNode.id, 10)
    expect(tower.run!.pendingCombatNodeId).toBeNull()
  })
})
