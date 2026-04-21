import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  _resetEventPoolCache,
  FALLBACK_EVENT_ID,
  loadEventPool,
  resolveEventEntry,
  pickEventIdFromActivePool,
} from './event-pool'

const MANIFEST_OK = {
  manifestVersion: 1,
  entries: [
    { id: 'healing-oasis', yamlPath: 'tower/events/healing-oasis.yaml' },
    { id: 'pilgrim-trade', yamlPath: 'tower/events/pilgrim-trade.yaml' },
    { id: 'event-fallback', yamlPath: 'tower/events/event-fallback.yaml', deprecated: 'never-in-pool' },
  ],
}

function mockFetch(body: unknown, ok = true) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  } as unknown as Response)
}

describe('event-pool', () => {
  afterEach(() => {
    _resetEventPoolCache()
    vi.restoreAllMocks()
  })

  it('loadEventPool caches', async () => {
    const fm = mockFetch(MANIFEST_OK)
    await loadEventPool()
    await loadEventPool()
    expect(fm).toHaveBeenCalledTimes(1)
  })

  it('resolveEventEntry returns Registry including deprecated', async () => {
    mockFetch(MANIFEST_OK)
    const e = await resolveEventEntry('event-fallback')
    expect(e.id).toBe('event-fallback')
  })

  it('resolveEventEntry falls back + console.error on miss', async () => {
    mockFetch(MANIFEST_OK)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const e = await resolveEventEntry('missing-id')
    expect(e.id).toBe(FALLBACK_EVENT_ID)
    expect(errSpy).toHaveBeenCalled()
  })

  it('pickEventIdFromActivePool deterministic by seed + excludes deprecated', async () => {
    mockFetch(MANIFEST_OK)
    const a = await pickEventIdFromActivePool('seed-1', 42)
    const b = await pickEventIdFromActivePool('seed-1', 42)
    expect(a).toBe(b)
    expect(['healing-oasis', 'pilgrim-trade']).toContain(a)
  })

  it('pickEventIdFromActivePool throws on empty active', async () => {
    mockFetch({
      manifestVersion: 1,
      entries: [
        { id: 'event-fallback', yamlPath: 'x', deprecated: 'never-in-pool' },
      ],
    })
    await expect(pickEventIdFromActivePool('seed', 1)).rejects.toThrow(/active pool.*empty/)
  })
})
