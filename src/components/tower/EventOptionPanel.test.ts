// src/components/tower/EventOptionPanel.test.ts
import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EventOptionPanel from './EventOptionPanel.vue'
import { useTowerStore } from '@/stores/tower'
import type { EventDef } from '@/tower/types'

const TEST_EVENT: EventDef = {
  id: 'test',
  title: 'Test Event',
  description: 'A test event for unit testing',
  options: [
    { id: 'opt-a', label: 'Always available', outcomes: [{ kind: 'determination', delta: 1 }] },
    { id: 'opt-b', label: 'Needs crystals', requires: { crystals: { $gte: 100 } }, outcomes: [] },
    { id: 'leave', label: 'Leave', outcomes: [] },
  ],
}

describe('EventOptionPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders title + description + 3 options', () => {
    const w = mount(EventOptionPanel, { props: { event: TEST_EVENT } })
    expect(w.text()).toContain('Test Event')
    expect(w.text()).toContain('A test event for unit testing')
    const buttons = w.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(3)
  })

  it('disables option with unmet requires', () => {
    // No active run → crystals default 0 → $gte 100 should fail.
    const w = mount(EventOptionPanel, { props: { event: TEST_EVENT } })
    const buttons = w.findAll('button')
    const needsCrystals = buttons.find((b) => b.text().includes('Needs crystals'))
    expect(needsCrystals).toBeDefined()
    expect((needsCrystals!.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('applies outcomes + emits resolved on click', async () => {
    const tower = useTowerStore()
    await tower.startNewRun('swordsman', 'seed-event-panel-test')
    const initialDet = tower.run!.determination

    const w = mount(EventOptionPanel, { props: { event: TEST_EVENT } })
    const alwaysAvailable = w
      .findAll('button')
      .find((b) => b.text().includes('Always available'))
    expect(alwaysAvailable).toBeDefined()
    await alwaysAvailable!.trigger('click')

    // clamped to max (maxDetermination defaults to 5)
    expect(tower.run!.determination).toBe(Math.min(5, initialDet + 1))
    expect(w.emitted().resolved).toBeTruthy()
    expect(w.emitted().resolved![0]).toEqual(['opt-a'])
  })

  it('disabled options do not trigger click', async () => {
    const tower = useTowerStore()
    await tower.startNewRun('swordsman', 'seed-disabled-click-test')
    const w = mount(EventOptionPanel, { props: { event: TEST_EVENT } })
    const needsCrystals = w
      .findAll('button')
      .find((b) => b.text().includes('Needs crystals'))
    await needsCrystals!.trigger('click')
    expect(w.emitted().resolved).toBeFalsy()
  })
})
