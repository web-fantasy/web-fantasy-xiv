// src/components/tower/BattleResultOverlay.test.ts
import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BattleResultOverlay from './BattleResultOverlay.vue'

type MountProps = {
  result: 'wipe' | 'victory'
  encounterKind: 'mob' | 'elite' | 'boss'
  determination: number
  encounterRewardCrystals?: number
}

function mountOverlay(props: MountProps) {
  return mount(BattleResultOverlay, {
    props: {
      encounterRewardCrystals: 10,
      ...props,
    },
  })
}

describe('BattleResultOverlay button matrix (phase 5)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mob wipe + determination > 0 shows [重试] + [放弃（低保/50%）]', () => {
    const w = mountOverlay({ result: 'wipe', encounterKind: 'mob', determination: 3 })
    expect(w.text()).toMatch(/重试/)
    expect(w.text()).toMatch(/放弃.*(水晶|50%|低保)/)
    const buttons = w.findAll('button')
    expect(buttons.length).toBe(2)
  })

  it('elite wipe + determination > 0 shows [重试] + [放弃（低保）] — same as mob', () => {
    const w = mountOverlay({ result: 'wipe', encounterKind: 'elite', determination: 3 })
    expect(w.text()).toMatch(/重试/)
    expect(w.text()).toMatch(/放弃.*(水晶|50%|低保)/)
    const buttons = w.findAll('button')
    expect(buttons.length).toBe(2)
  })

  it('boss wipe + determination > 0 shows [重试] + [放弃（整局结束）]', () => {
    const w = mountOverlay({ result: 'wipe', encounterKind: 'boss', determination: 3 })
    expect(w.text()).toMatch(/重试/)
    expect(w.text()).toMatch(/放弃.*(整局结束|结束)/)
    const buttons = w.findAll('button')
    expect(buttons.length).toBe(2)
  })

  it('any kind + determination == 0 shows only [进入结算]', () => {
    for (const kind of ['mob', 'elite', 'boss'] as const) {
      const w = mountOverlay({ result: 'wipe', encounterKind: kind, determination: 0 })
      const buttons = w.findAll('button')
      expect(buttons.length).toBe(1)
      expect(w.text()).toMatch(/进入结算/)
    }
  })

  it('emits retry / abandon / settle events', async () => {
    // retry
    const retryOverlay = mountOverlay({ result: 'wipe', encounterKind: 'mob', determination: 3 })
    const retryBtn = retryOverlay.findAll('button').find((b) => b.text().includes('重试'))
    expect(retryBtn).toBeDefined()
    await retryBtn!.trigger('click')
    expect(retryOverlay.emitted().retry).toBeTruthy()

    // abandon (mob/elite)
    const abandonOverlay = mountOverlay({ result: 'wipe', encounterKind: 'mob', determination: 3 })
    const abandonBtn = abandonOverlay.findAll('button').find((b) => b.text().includes('放弃'))
    expect(abandonBtn).toBeDefined()
    await abandonBtn!.trigger('click')
    expect(abandonOverlay.emitted().abandon).toBeTruthy()

    // abandon (boss) — same event
    const bossAbandonOverlay = mountOverlay({ result: 'wipe', encounterKind: 'boss', determination: 3 })
    const bossAbandonBtn = bossAbandonOverlay.findAll('button').find((b) => b.text().includes('放弃'))
    expect(bossAbandonBtn).toBeDefined()
    await bossAbandonBtn!.trigger('click')
    expect(bossAbandonOverlay.emitted().abandon).toBeTruthy()

    // settle (determination == 0)
    const settleOverlay = mountOverlay({ result: 'wipe', encounterKind: 'mob', determination: 0 })
    const settleBtn = settleOverlay.findAll('button')[0]
    await settleBtn.trigger('click')
    expect(settleOverlay.emitted().settle).toBeTruthy()
  })

  it('victory path preserved — shows 继续 and emits continue', async () => {
    const w = mountOverlay({ result: 'victory', encounterKind: 'mob', determination: 3, encounterRewardCrystals: 8 })
    expect(w.text()).toMatch(/继续/)
    expect(w.text()).toContain('8')
    const buttons = w.findAll('button')
    expect(buttons.length).toBe(1)
    await buttons[0].trigger('click')
    expect(w.emitted().continue).toBeTruthy()
  })
})
