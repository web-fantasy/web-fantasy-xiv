import { describe, expect, it } from 'vitest'
import { createEntity } from '@/entity/entity'
import { BuffSystem } from '@/combat/buff'
import { EventBus } from '@/core/event-bus'
import { activateCondition } from './echo'
import type { BattlefieldConditionPoolEntry } from '@/tower/pools/battlefield-condition-pool'

function setup(playerHp = 10000, playerAtk = 1000) {
  const bus = new EventBus()
  const buffSystem = new BuffSystem(bus)
  const player = createEntity({ id: 'p', type: 'player', hp: playerHp, attack: playerAtk })
  return { bus, buffSystem, player }
}

describe('activateCondition (echo dispatcher)', () => {
  const ECHO_BOSS: BattlefieldConditionPoolEntry = {
    id: 'echo-boss',
    kind: 'echo',
    params: { determinationThreshold: 2, allStatsBonusPct: 0.25 },
    scoutSummary: '',
  }

  it('determination > threshold → no buff applied', () => {
    const { buffSystem, player } = setup()
    activateCondition(ECHO_BOSS, { player, buffSystem, gameTime: 0 }, { determination: 5 })
    expect(player.buffs).toHaveLength(0)
  })

  it('determination == threshold → echo applied', () => {
    const { buffSystem, player } = setup()
    activateCondition(ECHO_BOSS, { player, buffSystem, gameTime: 0 }, { determination: 2 })
    expect(player.buffs).toHaveLength(1)
    expect(player.buffs[0].defId).toBe('echo')
  })

  it('determination < threshold → echo applied', () => {
    const { buffSystem, player } = setup()
    activateCondition(ECHO_BOSS, { player, buffSystem, gameTime: 0 }, { determination: 1 })
    expect(player.buffs[0].defId).toBe('echo')
  })

  it('applied echo: getAttack / getMaxHp reflect +25%', () => {
    const { buffSystem, player } = setup(10000, 1000)
    activateCondition(ECHO_BOSS, { player, buffSystem, gameTime: 0 }, { determination: 2 })
    expect(buffSystem.getAttack(player)).toBe(1250)
    expect(buffSystem.getMaxHp(player)).toBe(12500)
    expect(player.hp).toBe(10000) // hp NOT adjusted on apply (FF14 strict)
  })
})
