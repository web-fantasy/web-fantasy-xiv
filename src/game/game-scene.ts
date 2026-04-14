// src/game/game-scene.ts
import { Engine } from '@babylonjs/core'
import { SceneManager } from '@/renderer/scene-manager'
import { ArenaRenderer } from '@/renderer/arena-renderer'
import { EntityRenderer } from '@/renderer/entity-renderer'
import { AoeRenderer } from '@/renderer/aoe-renderer'
import { HitEffectRenderer } from '@/renderer/hit-effect-renderer'
import { EventBus } from '@/core/event-bus'
import { EntityManager } from '@/entity/entity-manager'
import { GameLoop } from '@/core/game-loop'
import { SkillResolver } from '@/skill/skill-resolver'
import { BuffSystem } from '@/combat/buff'
import { AoeZoneManager } from '@/skill/aoe-zone'
import { Arena } from '@/arena/arena'
import { InputManager } from '@/input/input-manager'
import { CameraController } from './camera-controller'
import { CombatResolver } from './combat-resolver'
import { PlayerInputDriver, type PlayerInputConfig } from './player-input-driver'
import { DisplacementAnimator } from './displacement-animator'
import { DevTerminal } from '@/devtools/dev-terminal'
import { CommandRegistry } from '@/devtools/commands'
import { paused as pausedSignal, battleResult } from '@/ui/state'
import type { ArenaDef } from '@/core/types'
import type { Entity } from '@/entity/entity'
import type { CreateEntityOptions } from '@/entity/entity'

export interface GameSceneConfig {
  engine: Engine
  uiRoot: HTMLDivElement
  arena: ArenaDef
  playerInputConfig: PlayerInputConfig
  /** Called to restart this scene (for retry) */
  restart: () => void
}

/**
 * Shared game scene infrastructure. Owns all core systems, renderers, UI, and the game loop.
 * Subclass-like usage: create a GameScene, then use its public members to add entities and logic.
 */
export class GameScene {
  // Core systems
  readonly bus = new EventBus()
  readonly entityMgr = new EntityManager(this.bus)
  readonly buffSystem = new BuffSystem(this.bus)
  readonly zoneMgr: AoeZoneManager
  readonly skillResolver: SkillResolver
  readonly arena: Arena
  readonly gameLoop = new GameLoop()
  readonly combatResolver: CombatResolver
  readonly displacer: DisplacementAnimator

  // Rendering
  readonly sceneManager: SceneManager
  readonly entityRenderer: EntityRenderer
  readonly aoeRenderer: AoeRenderer
  readonly hitEffectRenderer: HitEffectRenderer

  // Input + Camera
  readonly input: InputManager
  readonly camera: CameraController
  playerDriver!: PlayerInputDriver

  // UI (only DevTerminal remains — rest migrated to Preact)
  readonly devTerminal: DevTerminal

  // State
  paused = false
  battleOver = false
  player!: Entity
  private lastTime = performance.now()
  readonly config: GameSceneConfig

  /** Custom logic hook called each logic tick (after player update, before zone update) */
  onLogicTick: ((dt: number) => void) | null = null

  /** External hook called each render frame (for UI state adapter) */
  onRenderTick: ((delta: number) => void) | null = null

  /** Custom hook for combat elapsed time display. Return ms or null. */
  getCombatElapsed: (() => number | null) = () => null

  /** Reference entity for boss HP bar */
  bossEntity: Entity | null = null

  constructor(config: GameSceneConfig) {
    this.config = config

    this.arena = new Arena(config.arena)
    this.displacer = new DisplacementAnimator(this.arena)
    this.zoneMgr = new AoeZoneManager(this.bus, this.entityMgr)
    this.skillResolver = new SkillResolver(this.bus, this.entityMgr, this.buffSystem, this.zoneMgr)
    this.combatResolver = new CombatResolver(this.bus, this.entityMgr, this.buffSystem, this.arena, this.zoneMgr, this.displacer)

    // Rendering
    this.sceneManager = new SceneManager(config.engine)
    new ArenaRenderer(this.sceneManager.scene, config.arena, this.bus)
    this.entityRenderer = new EntityRenderer(this.sceneManager.scene, this.bus)
    this.aoeRenderer = new AoeRenderer(this.sceneManager.scene, this.bus, this.entityMgr)
    this.hitEffectRenderer = new HitEffectRenderer(this.sceneManager.scene, this.bus, this.entityRenderer)

    // Input + Camera
    this.input = new InputManager(config.engine.getRenderingCanvas()!)
    this.camera = new CameraController()

    // DevTerminal (only remaining vanilla UI)
    this.devTerminal = new DevTerminal(this.bus, new CommandRegistry())
    this.devTerminal.mount(config.uiRoot)
  }

  /** Create player entity and bind input driver + camera */
  createPlayer(opts: CreateEntityOptions): Entity {
    this.player = this.entityMgr.create(opts)
    this.camera.follow(this.player)
    this.playerDriver = new PlayerInputDriver(
      this.player, this.input, this.skillResolver, this.buffSystem,
      this.entityMgr, this.bus, this.arena, this.config.playerInputConfig,
    )
    return this.player
  }

  /** Watch for player death — sets battleResult signal */
  watchPlayerDeath(): void {
    this.bus.on('damage:dealt', (payload: { target: Entity }) => {
      if (payload.target.id === this.player.id && payload.target.hp <= 0) {
        if (this.battleOver) return
        this.battleOver = true
        this.bus.emit('combat:ended', { result: 'wipe' })
        battleResult.value = 'wipe'
      }
    })
  }

  /** Start the game loop + render loop */
  start(): void {
    this.gameLoop.onUpdate((dt) => {
      if (this.paused || this.battleOver) return
      if (this.devTerminal.isVisible()) return

      // Sync pause state from Preact signal
      if (pausedSignal.value !== this.paused) this.paused = pausedSignal.value

      const result = this.playerDriver.update(dt)
      if (result === 'pause') { this.paused = true; pausedSignal.value = true; return }

      this.onLogicTick?.(dt)

      this.displacer.update(dt)
      this.zoneMgr.update(dt)
    })

    this.sceneManager.startRenderLoop(() => {
      const now = performance.now()
      const delta = now - this.lastTime
      this.lastTime = now

      const mousePos = this.sceneManager.pickGroundPosition()
      if (mousePos) this.input.updateMouseWorldPos(mousePos)
      this.gameLoop.tick(delta)

      const camPos = this.camera.update(delta)
      const fallOffset = (this.player as any)?._fallOffset ?? 0
      this.sceneManager.setCameraTarget(camPos.x, camPos.y, fallOffset)
      this.sceneManager.updateRoll(delta)
      this.entityRenderer.updateAll(this.entityMgr.getAlive(), this.player?.target)
      this.aoeRenderer.update(now)
      this.hitEffectRenderer.update(delta, (id) => this.entityMgr.get(id))

      this.onRenderTick?.(delta)
    })
  }

  /** Dispose all resources */
  dispose(): void {
    this.sceneManager.dispose()
    this.input.dispose()
  }
}
