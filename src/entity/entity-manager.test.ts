// src/entity/entity-manager.test.ts
import { describe, it, expect, vi } from 'vitest'
import { EntityManager } from '@/entity/entity-manager'
import { EventBus } from '@/core/event-bus'

describe('EntityManager', () => {
  function setup() {
    const bus = new EventBus()
    const mgr = new EntityManager(bus)
    return { bus, mgr }
  }

  it('should create and retrieve entity', () => {
    const { mgr } = setup()
    const e = mgr.create({ id: 'p1', type: 'player', hp: 1000, maxHp: 1000 })
    expect(mgr.get('p1')).toBe(e)
  })

  it('should emit entity:created on create', () => {
    const { bus, mgr } = setup()
    const handler = vi.fn()
    bus.on('entity:created', handler)
    mgr.create({ id: 'p1', type: 'player' })
    expect(handler).toHaveBeenCalledWith({ entity: expect.objectContaining({ id: 'p1' }) })
  })

  it('should destroy entity and emit entity:died', () => {
    const { bus, mgr } = setup()
    mgr.create({ id: 'b1', type: 'boss' })
    const handler = vi.fn()
    bus.on('entity:died', handler)
    mgr.destroy('b1')
    expect(mgr.get('b1')).toBeUndefined()
    expect(handler).toHaveBeenCalled()
  })

  it('should find nearest enemy', () => {
    const { mgr } = setup()
    mgr.create({ id: 'p1', type: 'player', position: { x: 0, y: 0, z: 0 } })
    mgr.create({ id: 'b1', type: 'boss', position: { x: 10, y: 0, z: 0 } })
    mgr.create({ id: 'm1', type: 'mob', position: { x: 3, y: 0, z: 0 } })

    const nearest = mgr.findNearest('p1', (e) => e.type !== 'player' && e.alive)
    expect(nearest?.id).toBe('m1')
  })

  it('should return all entities of a type', () => {
    const { mgr } = setup()
    mgr.create({ id: 'p1', type: 'player' })
    mgr.create({ id: 'b1', type: 'boss' })
    mgr.create({ id: 'm1', type: 'mob' })
    mgr.create({ id: 'm2', type: 'mob' })

    const mobs = mgr.getByType('mob')
    expect(mobs).toHaveLength(2)
  })

  it('should return all alive entities', () => {
    const { mgr } = setup()
    const e1 = mgr.create({ id: 'p1', type: 'player' })
    const e2 = mgr.create({ id: 'm1', type: 'mob' })
    e2.alive = false
    expect(mgr.getAlive()).toHaveLength(1)
    expect(mgr.getAlive()[0].id).toBe('p1')
  })
})
