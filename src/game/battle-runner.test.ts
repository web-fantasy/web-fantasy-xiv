import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventBus } from '@/core/event-bus'
import { BuffSystem } from '@/combat/buff'
import { createEntity } from '@/entity/entity'
import { createDeathWindow, DEATH_WINDOW_MS, DEATH_WINDOW_NO_DOT_CAP_MS } from './battle-runner'
import type { Entity, BuffInstance } from '@/entity/entity'

/**
 * Unit tests for the death-window runtime contract.
 *
 * Contract (phase 5 unified):
 *  - enter() does NOT emit combat:ended; it emits player:died and calls clearDeathBuffs
 *  - tick(gameTime) finalizes with one of two outcomes:
 *      victory  — boss.hp <= 0 (instant, no window-delay)
 *      wipe     — gameTime >= deadline (DEATH_WINDOW_MS elapsed or per-encounter override)
 *    Notably no DoT-presence branch: the window is a unified buffer regardless of
 *    player DoTs on boss. If no DoT is active, the window still runs to deadline.
 *  - finalize() emits combat:ended {result, elapsed} exactly once and calls endBattle(result)
 */

function setup() {
  const bus = new EventBus()
  const buffSystem = new BuffSystem(bus)

  const player = createEntity({ id: 'player', type: 'player', hp: 100, maxHp: 100, attack: 10 })
  const boss = createEntity({ id: 'boss', type: 'boss', hp: 1000, maxHp: 1000, attack: 10 })

  let elapsed = 0
  const getElapsed = () => elapsed
  const advance = (ms: number) => { elapsed += ms }

  const endBattle = vi.fn()
  const disposeAll = vi.fn()
  const scriptRunner = { disposeAll }

  const dw = createDeathWindow({
    bus,
    player,
    boss,
    buffSystem,
    scriptRunner,
    endBattle,
    getElapsed,
  })

  return { bus, buffSystem, player, boss, dw, endBattle, disposeAll, getElapsed, advance, setElapsed: (ms: number) => { elapsed = ms } }
}

/** Build a player-owned DoT instance on a target, with nextTickAt in the future. */
function addPlayerDot(target: Entity, playerId: string, opts?: { remaining?: number; nextTickAt?: number }): BuffInstance {
  const inst: BuffInstance = {
    defId: 'player_dot',
    sourceId: playerId,
    remaining: opts?.remaining ?? 30000,
    stacks: 1,
    periodic: {
      nextTickAt: opts?.nextTickAt ?? 1000,
      interval: 3000,
      effectType: 'dot',
      snapshot: { attack: 100, casterIncreases: [], potency: 50 },
      sourceCasterId: playerId,
    },
  }
  target.buffs.push(inst)
  return inst
}

describe('death window runtime — constants', () => {
  it('DEATH_WINDOW_MS default is 5 seconds', () => {
    expect(DEATH_WINDOW_MS).toBe(5000)
  })
})

describe('death window runtime — enter', () => {
  it('enter() does NOT emit combat:ended and marks state active', () => {
    const { bus, player, dw } = setup()
    const combatEnded = vi.fn()
    const playerDied = vi.fn()
    bus.on('combat:ended', combatEnded)
    bus.on('player:died', playerDied)

    player.hp = 0
    dw.enter()

    expect(combatEnded).not.toHaveBeenCalled()
    expect(playerDied).toHaveBeenCalledTimes(1)
    expect(dw.isActive()).toBe(true)
  })

  it('enter() calls buffSystem.clearDeathBuffs on player', () => {
    const { buffSystem, player, dw } = setup()
    const spy = vi.spyOn(buffSystem, 'clearDeathBuffs')

    dw.enter()

    expect(spy).toHaveBeenCalledWith(player)
  })

  it('enter() twice is a no-op — second call does not re-enter or re-emit', () => {
    const { bus, dw } = setup()
    const playerDied = vi.fn()
    bus.on('player:died', playerDied)

    dw.enter()
    dw.enter()

    expect(playerDied).toHaveBeenCalledTimes(1)
    expect(dw.isActive()).toBe(true)
  })

  it('enter() records deadline = elapsed + DEATH_WINDOW_MS when a player DoT is present', () => {
    const { boss, dw, setElapsed } = setup()
    addPlayerDot(boss, 'player') // ensures the full window is used, not the no-DoT cap
    setElapsed(5000)
    dw.enter()
    const state = dw.getState()
    expect(state).not.toBeNull()
    expect(state!.startedAt).toBe(5000)
    expect(state!.deadline).toBe(5000 + DEATH_WINDOW_MS)
  })

  it('enter() uses DEATH_WINDOW_NO_DOT_CAP_MS when no player DoT is on any enemy', () => {
    const { dw, setElapsed } = setup()
    setElapsed(1000)
    dw.enter()
    const state = dw.getState()
    expect(state!.deadline).toBe(1000 + DEATH_WINDOW_NO_DOT_CAP_MS)
  })
})

describe('death window runtime — tick: victory', () => {
  it('boss hp <= 0 during window finalizes victory', () => {
    const { bus, boss, dw, endBattle, disposeAll, advance, getElapsed } = setup()
    addPlayerDot(boss, 'player')
    const combatEnded = vi.fn()
    bus.on('combat:ended', combatEnded)

    dw.enter()
    // Simulate DoT killing boss mid-window
    boss.hp = 0
    advance(3000)
    dw.tick(getElapsed())

    expect(combatEnded).toHaveBeenCalledTimes(1)
    expect(combatEnded.mock.calls[0][0]).toEqual({ result: 'victory', elapsed: getElapsed() })
    expect(endBattle).toHaveBeenCalledWith('victory')
    expect(disposeAll).toHaveBeenCalledTimes(1)
    expect(dw.isActive()).toBe(false)
  })

  it('victory fires instantly within the window (DoT kills boss in first tick)', () => {
    const { bus, boss, dw, endBattle, getElapsed } = setup()
    addPlayerDot(boss, 'player')
    const combatEnded = vi.fn()
    bus.on('combat:ended', combatEnded)

    dw.enter()
    // Immediately kill boss and tick same-frame
    boss.hp = 0
    dw.tick(getElapsed())

    expect(combatEnded).toHaveBeenCalledTimes(1)
    expect(combatEnded.mock.calls[0][0].result).toBe('victory')
    expect(endBattle).toHaveBeenCalledWith('victory')
  })
})

describe('death window runtime — tick: wipe (timeout)', () => {
  it('gameTime >= deadline finalizes wipe', () => {
    const { bus, boss, dw, endBattle, advance, getElapsed } = setup()
    addPlayerDot(boss, 'player')
    const combatEnded = vi.fn()
    bus.on('combat:ended', combatEnded)

    dw.enter()
    // Boss still alive, DoT still ticking, but deadline passes
    advance(DEATH_WINDOW_MS + 100)
    dw.tick(getElapsed())

    expect(combatEnded).toHaveBeenCalledTimes(1)
    expect(combatEnded.mock.calls[0][0].result).toBe('wipe')
    expect(endBattle).toHaveBeenCalledWith('wipe')
    expect(dw.isActive()).toBe(false)
  })

  it('before deadline, tick is a no-op when boss alive and DoT active', () => {
    const { bus, boss, dw, advance, getElapsed } = setup()
    addPlayerDot(boss, 'player')
    const combatEnded = vi.fn()
    bus.on('combat:ended', combatEnded)

    dw.enter()
    advance(DEATH_WINDOW_MS - 100)
    dw.tick(getElapsed())

    expect(combatEnded).not.toHaveBeenCalled()
    expect(dw.isActive()).toBe(true)
  })
})

describe('death window runtime — tick: window runs to deadline regardless of DoT lifecycle', () => {
  it('no player DoT on boss: window runs to (capped) deadline before wipe', () => {
    const { bus, dw, endBattle, advance, getElapsed } = setup()
    const combatEnded = vi.fn()
    bus.on('combat:ended', combatEnded)

    dw.enter()
    // Halfway through the no-DoT cap — still no finalize
    advance(DEATH_WINDOW_NO_DOT_CAP_MS / 2)
    dw.tick(getElapsed())
    expect(combatEnded).not.toHaveBeenCalled()

    // Now past the capped deadline
    advance(DEATH_WINDOW_NO_DOT_CAP_MS / 2 + 100)
    dw.tick(getElapsed())
    expect(combatEnded).toHaveBeenCalledTimes(1)
    expect(combatEnded.mock.calls[0][0].result).toBe('wipe')
    expect(endBattle).toHaveBeenCalledWith('wipe')
  })

  it('player DoT present: window runs the full DEATH_WINDOW_MS (no early finalize when DoT expires)', () => {
    const { bus, boss, dw, advance, getElapsed } = setup()
    const dot = addPlayerDot(boss, 'player')
    const combatEnded = vi.fn()
    bus.on('combat:ended', combatEnded)

    dw.enter()
    advance(1000)
    dw.tick(getElapsed())
    expect(combatEnded).not.toHaveBeenCalled()

    // Simulate DoT expiring mid-window. Window does NOT shorten — unified buffer.
    boss.buffs = boss.buffs.filter((b) => b !== dot)
    advance(1000)
    dw.tick(getElapsed())
    expect(combatEnded).not.toHaveBeenCalled()

    // Past deadline
    advance(DEATH_WINDOW_MS)
    dw.tick(getElapsed())
    expect(combatEnded).toHaveBeenCalledTimes(1)
    expect(combatEnded.mock.calls[0][0].result).toBe('wipe')
  })
})

describe('death window runtime — per-encounter windowMs override', () => {
  it('deps.windowMs overrides DEATH_WINDOW_MS for this window instance', () => {
    const bus = new EventBus()
    const buffSystem = new BuffSystem(bus)
    const player = createEntity({ id: 'player', type: 'player', hp: 100, maxHp: 100, attack: 10 })
    const boss = createEntity({ id: 'boss', type: 'boss', hp: 1000, maxHp: 1000, attack: 10 })
    addPlayerDot(boss, 'player') // keeps full window (otherwise no-DoT cap would shorten)
    let elapsed = 0
    const endBattle = vi.fn()
    const scriptRunner = { disposeAll: vi.fn() }
    const dw = createDeathWindow({
      bus, player, boss, buffSystem, scriptRunner, endBattle,
      getElapsed: () => elapsed,
      windowMs: 3000, // longer than no-DoT cap to clearly exercise override
    })
    const combatEnded = vi.fn()
    bus.on('combat:ended', combatEnded)

    dw.enter()
    expect(dw.getState()!.deadline).toBe(3000) // startedAt 0 + 3000
    elapsed = 2500
    dw.tick(elapsed)
    expect(combatEnded).not.toHaveBeenCalled() // still inside override window
    elapsed = 3100
    dw.tick(elapsed)
    expect(combatEnded).toHaveBeenCalledTimes(1)
    expect(combatEnded.mock.calls[0][0].result).toBe('wipe')
  })

  it('deps.windowMs undefined → falls back to DEATH_WINDOW_MS default', () => {
    const { boss, dw } = setup()
    addPlayerDot(boss, 'player')
    dw.enter()
    expect(dw.getState()!.deadline).toBe(DEATH_WINDOW_MS)
  })

  it('deps.windowMs = 0 → instant window (deadline === startedAt)', () => {
    const bus = new EventBus()
    const buffSystem = new BuffSystem(bus)
    const player = createEntity({ id: 'player', type: 'player', hp: 100, maxHp: 100, attack: 10 })
    const boss = createEntity({ id: 'boss', type: 'boss', hp: 1000, maxHp: 1000, attack: 10 })
    const dw = createDeathWindow({
      bus, player, boss, buffSystem,
      scriptRunner: { disposeAll: vi.fn() },
      endBattle: vi.fn(),
      getElapsed: () => 0,
      windowMs: 0, // explicit zero is valid — no window at all
    })
    const combatEnded = vi.fn()
    bus.on('combat:ended', combatEnded)

    dw.enter()
    expect(dw.getState()!.deadline).toBe(0)
    dw.tick(0)
    // First tick with gameTime >= deadline → instant wipe
    expect(combatEnded).toHaveBeenCalledTimes(1)
    expect(combatEnded.mock.calls[0][0].result).toBe('wipe')
  })

  it('deps.windowMs < 0 → falls back to DEATH_WINDOW_MS default (defensive)', () => {
    const bus = new EventBus()
    const buffSystem = new BuffSystem(bus)
    const player = createEntity({ id: 'player', type: 'player', hp: 100, maxHp: 100, attack: 10 })
    const boss = createEntity({ id: 'boss', type: 'boss', hp: 1000, maxHp: 1000, attack: 10 })
    addPlayerDot(boss, 'player')
    const dw = createDeathWindow({
      bus, player, boss, buffSystem,
      scriptRunner: { disposeAll: vi.fn() },
      endBattle: vi.fn(),
      getElapsed: () => 0,
      windowMs: -100, // invalid → default
    })
    dw.enter()
    expect(dw.getState()!.deadline).toBe(DEATH_WINDOW_MS)
  })

  it('no-DoT cap: encounter windowMs > 2000 + no DoT → deadline = 2000', () => {
    const bus = new EventBus()
    const buffSystem = new BuffSystem(bus)
    const player = createEntity({ id: 'player', type: 'player', hp: 100, maxHp: 100, attack: 10 })
    const boss = createEntity({ id: 'boss', type: 'boss', hp: 1000, maxHp: 1000, attack: 10 })
    const dw = createDeathWindow({
      bus, player, boss, buffSystem,
      scriptRunner: { disposeAll: vi.fn() },
      endBattle: vi.fn(),
      getElapsed: () => 0,
      windowMs: 8000, // long window
      // default hasPlayerDotOnEnemies → checks boss.buffs → no DoT present
    })
    dw.enter()
    expect(dw.getState()!.deadline).toBe(DEATH_WINDOW_NO_DOT_CAP_MS)
  })

  it('no-DoT cap: encounter windowMs < 2000 + no DoT → deadline = windowMs (override wins when shorter)', () => {
    const bus = new EventBus()
    const buffSystem = new BuffSystem(bus)
    const player = createEntity({ id: 'player', type: 'player', hp: 100, maxHp: 100, attack: 10 })
    const boss = createEntity({ id: 'boss', type: 'boss', hp: 1000, maxHp: 1000, attack: 10 })
    const dw = createDeathWindow({
      bus, player, boss, buffSystem,
      scriptRunner: { disposeAll: vi.fn() },
      endBattle: vi.fn(),
      getElapsed: () => 0,
      windowMs: 500,
    })
    dw.enter()
    expect(dw.getState()!.deadline).toBe(500)
  })

  it('hasPlayerDotOnEnemies custom predicate: true → full window, false → no-DoT cap', () => {
    const bus = new EventBus()
    const buffSystem = new BuffSystem(bus)
    const player = createEntity({ id: 'player', type: 'player', hp: 100, maxHp: 100, attack: 10 })
    const boss = createEntity({ id: 'boss', type: 'boss', hp: 1000, maxHp: 1000, attack: 10 })

    const dwTrue = createDeathWindow({
      bus, player, boss, buffSystem,
      scriptRunner: { disposeAll: vi.fn() },
      endBattle: vi.fn(),
      getElapsed: () => 0,
      windowMs: 5000,
      hasPlayerDotOnEnemies: () => true,
    })
    dwTrue.enter()
    expect(dwTrue.getState()!.deadline).toBe(5000)

    const dwFalse = createDeathWindow({
      bus, player, boss, buffSystem,
      scriptRunner: { disposeAll: vi.fn() },
      endBattle: vi.fn(),
      getElapsed: () => 0,
      windowMs: 5000,
      hasPlayerDotOnEnemies: () => false,
    })
    dwFalse.enter()
    expect(dwFalse.getState()!.deadline).toBe(DEATH_WINDOW_NO_DOT_CAP_MS)
  })
})

describe('death window runtime — tick: no-op when inactive', () => {
  it('tick() before enter() is a no-op', () => {
    const { bus, dw, endBattle, getElapsed } = setup()
    const combatEnded = vi.fn()
    bus.on('combat:ended', combatEnded)

    dw.tick(getElapsed())

    expect(combatEnded).not.toHaveBeenCalled()
    expect(endBattle).not.toHaveBeenCalled()
  })

  it('tick() after finalize is a no-op (single-fire guarantee)', () => {
    const { bus, boss, dw, advance, getElapsed } = setup()
    addPlayerDot(boss, 'player')
    const combatEnded = vi.fn()
    bus.on('combat:ended', combatEnded)

    dw.enter()
    boss.hp = 0
    advance(3000)
    dw.tick(getElapsed()) // first tick → finalize victory
    dw.tick(getElapsed()) // second tick → should be no-op

    expect(combatEnded).toHaveBeenCalledTimes(1)
  })
})

describe('death window runtime — finalize priority', () => {
  it('victory takes priority over deadline when boss dies exactly at deadline', () => {
    const { bus, boss, dw, advance, getElapsed } = setup()
    addPlayerDot(boss, 'player')
    const combatEnded = vi.fn()
    bus.on('combat:ended', combatEnded)

    dw.enter()
    boss.hp = 0
    advance(DEATH_WINDOW_MS + 500) // past deadline AND boss dead
    dw.tick(getElapsed())

    expect(combatEnded.mock.calls[0][0].result).toBe('victory')
  })
})
