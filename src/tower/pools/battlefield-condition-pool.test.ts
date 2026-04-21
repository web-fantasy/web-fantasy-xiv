import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  _resetBattlefieldConditionPoolCache,
  FALLBACK_CONDITION_ID,
  loadBattlefieldConditionPool,
  resolveCondition,
  pickConditionIdFromActivePool,
} from './battlefield-condition-pool'

const MANIFEST_OK = {
  manifestVersion: 1,
  entries: [
    {
      id: 'echo-boss',
      kind: 'echo',
      params: { determinationThreshold: 2, allStatsBonusPct: 0.25 },
      scoutSummary: '决心 ≤ 2 时获得超越之力（攻防血 +25%）',
    },
    {
      id: 'echo-fallback',
      kind: 'echo',
      params: { determinationThreshold: 0, allStatsBonusPct: 0 },
      scoutSummary: '（fallback，永不触发）',
      deprecated: 'never-in-pool',
    },
  ],
}

function mockFetch(body: unknown, ok = true) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  } as unknown as Response)
}

describe('battlefield-condition-pool', () => {
  afterEach(() => {
    _resetBattlefieldConditionPoolCache()
    vi.restoreAllMocks()
  })

  it('loadBattlefieldConditionPool fetches manifest + caches', async () => {
    const fetchMock = mockFetch(MANIFEST_OK)
    const p1 = await loadBattlefieldConditionPool()
    const p2 = await loadBattlefieldConditionPool()
    expect(p1).toBe(p2)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('resolveCondition returns Registry entry including deprecated', async () => {
    mockFetch(MANIFEST_OK)
    const entry = await resolveCondition('echo-fallback')
    expect(entry.id).toBe('echo-fallback')
  })

  it('resolveCondition falls back + console.error on missing', async () => {
    mockFetch(MANIFEST_OK)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const entry = await resolveCondition('missing-id')
    expect(entry.id).toBe(FALLBACK_CONDITION_ID)
    expect(errSpy).toHaveBeenCalled()
  })

  it('resolveCondition throws hard error when even fallback is missing', async () => {
    mockFetch({
      manifestVersion: 1,
      entries: [
        {
          id: 'something-else',
          kind: 'echo',
          params: { determinationThreshold: 0, allStatsBonusPct: 0 },
          scoutSummary: '',
        },
      ],
    })
    await expect(resolveCondition('missing')).rejects.toThrow(/FALLBACK/)
  })

  it('pickConditionIdFromActivePool deterministic by seed + excludes deprecated', async () => {
    mockFetch(MANIFEST_OK)
    const a = await pickConditionIdFromActivePool('seed-1', 'boss-tower-warden', 'echo')
    const b = await pickConditionIdFromActivePool('seed-1', 'boss-tower-warden', 'echo')
    expect(a).toBe(b)
    // echo-fallback is deprecated so only echo-boss in active pool
    expect(a).toBe('echo-boss')
  })

  it('pickConditionIdFromActivePool throws when active pool for kind empty', async () => {
    mockFetch({
      manifestVersion: 1,
      entries: [
        {
          id: 'echo-fallback',
          kind: 'echo',
          params: { determinationThreshold: 0, allStatsBonusPct: 0 },
          scoutSummary: '',
          deprecated: 'never-in-pool',
        },
      ],
    })
    await expect(pickConditionIdFromActivePool('seed', 'x', 'echo')).rejects.toThrow(/active pool.*empty/)
  })
})
