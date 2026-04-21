import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEntity } from '@/entity/entity'
import { BuffSystem } from '@/combat/buff'
import { EventBus } from '@/core/event-bus'
import { activateConditionsForEncounter } from './activate-for-encounter'
import { _resetBattlefieldConditionPoolCache } from '@/tower/pools/battlefield-condition-pool'

function setup() {
  const bus = new EventBus()
  const buffSystem = new BuffSystem(bus)
  const player = createEntity({ id: 'p', type: 'player', hp: 10000, attack: 1000 })
  return { bus, buffSystem, player }
}

function mockConditionPool() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true, status: 200,
    json: async () => ({
      manifestVersion: 1,
      entries: [
        { id: 'echo-boss', kind: 'echo',
          params: { determinationThreshold: 2, allStatsBonusPct: 0.25 },
          scoutSummary: 'echo' },
        { id: 'echo-fallback', kind: 'echo',
          params: { determinationThreshold: 0, allStatsBonusPct: 0 },
          scoutSummary: '', deprecated: 'never-in-pool' },
      ],
    }),
  } as unknown as Response)
}

describe('activateConditionsForEncounter', () => {
  beforeEach(() => {
    _resetBattlefieldConditionPoolCache()
    mockConditionPool()
  })
  afterEach(() => { vi.restoreAllMocks() })

  it('noop when encounter.conditions undefined', async () => {
    const { buffSystem, player } = setup()
    await activateConditionsForEncounter(
      { conditions: undefined },
      { player, buffSystem, gameTime: 0 },
      { determination: 2 },
    )
    expect(player.buffs).toHaveLength(0)
  })

  it('noop when encounter.conditions is empty array', async () => {
    const { buffSystem, player } = setup()
    await activateConditionsForEncounter(
      { conditions: [] },
      { player, buffSystem, gameTime: 0 },
      { determination: 2 },
    )
    expect(player.buffs).toHaveLength(0)
  })

  it('activates echo when conditions=[echo-boss] and determination <= threshold', async () => {
    const { buffSystem, player } = setup()
    await activateConditionsForEncounter(
      { conditions: ['echo-boss'] },
      { player, buffSystem, gameTime: 0 },
      { determination: 2 },
    )
    expect(player.buffs).toHaveLength(1)
    expect(player.buffs[0].defId).toBe('echo')
  })

  it('does not activate echo when determination > threshold', async () => {
    const { buffSystem, player } = setup()
    await activateConditionsForEncounter(
      { conditions: ['echo-boss'] },
      { player, buffSystem, gameTime: 0 },
      { determination: 5 },
    )
    expect(player.buffs).toHaveLength(0)
  })
})
