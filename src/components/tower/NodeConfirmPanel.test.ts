// src/components/tower/NodeConfirmPanel.test.ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NodeConfirmPanel from './NodeConfirmPanel.vue'
import { useTowerStore } from '@/stores/tower'
import type { TowerNode } from '@/tower/types'

// Mock pools + encounter loader so tests don't hit the network / filesystem.
vi.mock('@/tower/pools/encounter-pool', () => ({
  resolveEncounter: vi.fn(async (id: string) => ({
    id,
    yamlPath: `/encounters/${id}.yaml`,
    kind: 'boss' as const,
    scoutSummary: 'scout',
    rewards: { crystals: 3 },
  })),
}))

const resolveConditionMock = vi.fn()
vi.mock('@/tower/pools/battlefield-condition-pool', () => ({
  resolveCondition: (id: string) => resolveConditionMock(id),
}))

const loadEncounterMock = vi.fn()
vi.mock('@/game/encounter-loader', () => ({
  loadEncounter: (url: string) => loadEncounterMock(url),
}))

const ECHO_BOSS_ENTRY = {
  id: 'echo-boss',
  kind: 'echo' as const,
  params: { determinationThreshold: 2, allStatsBonusPct: 0.25 },
  scoutSummary: '决心 ≤ 2 时获得超越之力（攻防血 +25%）',
}

function makeNode(overrides: Partial<TowerNode>): TowerNode {
  return {
    id: 42,
    step: 13,
    slot: 0,
    kind: 'boss',
    next: [],
    ...overrides,
  }
}

describe('NodeConfirmPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resolveConditionMock.mockReset()
    loadEncounterMock.mockReset()
  })

  it('boss node with encounter conditions renders scoutSummary list', async () => {
    loadEncounterMock.mockResolvedValue({ conditions: ['echo-boss'] })
    resolveConditionMock.mockResolvedValue(ECHO_BOSS_ENTRY)

    const node = makeNode({ kind: 'boss', encounterId: 'boss-tower-warden' })
    const w = mount(NodeConfirmPanel, { props: { node } })
    await flushPromises()

    expect(loadEncounterMock).toHaveBeenCalledWith('/encounters/boss-tower-warden.yaml')
    expect(resolveConditionMock).toHaveBeenCalledWith('echo-boss')

    const section = w.find('.confirm-panel__conditions')
    expect(section.exists()).toBe(true)
    expect(section.text()).toContain('决心 ≤ 2 时获得超越之力')
  })

  it('mob node does NOT render conditions section + does not load encounter', async () => {
    const node = makeNode({ kind: 'mob', encounterId: 'mob-frost-sprite', step: 3, id: 5 })
    const w = mount(NodeConfirmPanel, { props: { node } })
    await flushPromises()

    expect(loadEncounterMock).not.toHaveBeenCalled()
    expect(w.find('.confirm-panel__conditions').exists()).toBe(false)
  })

  it('enter button is enabled for elite + boss (phase 5 unblocked)', async () => {
    loadEncounterMock.mockResolvedValue({ conditions: [] })

    const eliteNode = makeNode({ kind: 'elite', encounterId: 'elite-x', step: 6, id: 10 })
    const wElite = mount(NodeConfirmPanel, { props: { node: eliteNode } })
    await flushPromises()
    const eliteEnter = wElite.findAll('button').find((b) => b.text().includes('进入战斗'))
    expect(eliteEnter).toBeDefined()
    expect((eliteEnter!.element as HTMLButtonElement).disabled).toBe(false)
    expect(eliteEnter!.text()).not.toContain('phase 5 实装')

    const bossNode = makeNode({ kind: 'boss', encounterId: 'boss-y' })
    const wBoss = mount(NodeConfirmPanel, { props: { node: bossNode } })
    await flushPromises()
    const bossEnter = wBoss.findAll('button').find((b) => b.text().includes('进入战斗'))
    expect(bossEnter).toBeDefined()
    expect((bossEnter!.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('highlights "将立即触发" when determination <= echo threshold', async () => {
    loadEncounterMock.mockResolvedValue({ conditions: ['echo-boss'] })
    resolveConditionMock.mockResolvedValue(ECHO_BOSS_ENTRY)

    const tower = useTowerStore()
    await tower.startNewRun('swordsman', 'seed-trigger')
    // Force determination below threshold (2)
    tower.run!.determination = 1

    const node = makeNode({ kind: 'boss', encounterId: 'boss-tower-warden' })
    const w = mount(NodeConfirmPanel, { props: { node } })
    await flushPromises()

    const section = w.find('.confirm-panel__conditions')
    expect(section.exists()).toBe(true)
    expect(section.text()).toContain('当前将立即触发')
  })

  it('does NOT highlight trigger hint when determination > threshold', async () => {
    loadEncounterMock.mockResolvedValue({ conditions: ['echo-boss'] })
    resolveConditionMock.mockResolvedValue(ECHO_BOSS_ENTRY)

    const tower = useTowerStore()
    await tower.startNewRun('swordsman', 'seed-notrigger')
    tower.run!.determination = 5 // well above threshold

    const node = makeNode({ kind: 'boss', encounterId: 'boss-tower-warden' })
    const w = mount(NodeConfirmPanel, { props: { node } })
    await flushPromises()

    const section = w.find('.confirm-panel__conditions')
    expect(section.exists()).toBe(true)
    expect(section.text()).not.toContain('当前将立即触发')
  })

  it('boss node without encounterId renders no conditions section (non-tower route)', async () => {
    const node = makeNode({ kind: 'boss', encounterId: undefined })
    const w = mount(NodeConfirmPanel, { props: { node } })
    await flushPromises()

    expect(loadEncounterMock).not.toHaveBeenCalled()
    expect(w.find('.confirm-panel__conditions').exists()).toBe(false)
  })
})
