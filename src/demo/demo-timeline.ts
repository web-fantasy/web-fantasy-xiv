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
import { BossBehavior } from '@/ai/boss-behavior'
import { TimelineScheduler } from '@/timeline/timeline-scheduler'
import { InputManager } from '@/input/input-manager'
import { CameraController } from '@/game/camera-controller'
import { CombatResolver } from '@/game/combat-resolver'
import { PlayerInputDriver } from '@/game/player-input-driver'
import { DisplacementAnimator } from '@/game/displacement-animator'
import { loadEncounter, type EncounterData } from '@/game/encounter-loader'
import { UIManager } from '@/ui/ui-manager'
import { TimelineDisplay } from '@/ui/timeline-display'
import { PauseMenu } from '@/ui/pause-menu'
import { DevTerminal } from '@/devtools/dev-terminal'
import { CommandRegistry } from '@/devtools/commands'
import { DebugInfo } from '@/ui/debug-info'
import { CombatAnnounce } from '@/ui/combat-announce'
import { DEMO_SKILLS, AUTO_ATTACK, SKILL_DASH, SKILL_BACKSTEP } from './demo-skills'
import { DEMO_SKILL_BAR } from './demo-skill-bar'
import type { TimelineAction } from '@/config/schema'
import type { Entity } from '@/entity/entity'

let cleanup: (() => void) | null = null

export async function startTimelineDemo(canvas: HTMLCanvasElement, uiRoot: HTMLDivElement): Promise<void> {
  if (cleanup) { cleanup(); cleanup = null }

  // Load encounter from YAML
  const encounter = await loadEncounter('/encounters/timeline-test.yaml')
  initScene(canvas, uiRoot, encounter)
}

function initScene(canvas: HTMLCanvasElement, uiRoot: HTMLDivElement, enc: EncounterData): void {
  const bus = new EventBus()
  const entityMgr = new EntityManager(bus)
  const buffSystem = new BuffSystem(bus)
  const zoneMgr = new AoeZoneManager(bus, entityMgr)
  const skillResolver = new SkillResolver(bus, entityMgr, buffSystem, zoneMgr)
  const arena = new Arena(enc.arena)
  const gameLoop = new GameLoop()
  const displacer = new DisplacementAnimator(arena)

  new CombatResolver(bus, entityMgr, buffSystem, arena, displacer)

  // Rendering
  const sceneManager = new SceneManager(canvas)
  new ArenaRenderer(sceneManager.scene, enc.arena)
  const entityRenderer = new EntityRenderer(sceneManager.scene, bus)
  const aoeRenderer = new AoeRenderer(sceneManager.scene, bus)
  const hitEffectRenderer = new HitEffectRenderer(sceneManager.scene, bus, entityRenderer)

  // Entities
  const player = entityMgr.create({
    id: 'player',
    type: 'player',
    position: { x: 0, y: -12, z: 0 },
    ...enc.player,
  })

  const boss = entityMgr.create(enc.boss)

  const bossAI = new BossBehavior(boss, enc.bossAI)
  bossAI.lockFacing(boss.facing)
  let aiEnabled = false
  let combatStarted = false

  const bossAutoSkill = enc.skills.get('boss_auto')
  const scheduler = new TimelineScheduler(bus, enc.timeline)

  // Camera + Input + Player
  const camera = new CameraController()
  camera.follow(player)

  const input = new InputManager(canvas)
  const playerDriver = new PlayerInputDriver(
    player, input, skillResolver, buffSystem, entityMgr, bus, arena,
    {
      skills: DEMO_SKILLS,
      extraSkills: new Map([[100, SKILL_DASH], [101, SKILL_BACKSTEP]]),
      autoAttackSkill: AUTO_ATTACK,
      autoAttackInterval: 3000,
    },
  )

  // UI
  const uiManager = new UIManager(uiRoot, bus, DEMO_SKILL_BAR)
  uiManager.bindScene(sceneManager)
  const timelineDisplay = new TimelineDisplay(uiRoot, enc.timeline, enc.skills)
  const pauseMenu = new PauseMenu(uiRoot)
  const devTerminal = new DevTerminal(bus, new CommandRegistry())
  devTerminal.mount(uiRoot)
  const debugInfo = new DebugInfo(uiRoot)
  const announce = new CombatAnnounce(uiRoot)

  let paused = false
  let battleOver = false

  pauseMenu.onResumeGame(() => { paused = false; pauseMenu.hide() })
  pauseMenu.onRetryGame(() => startTimelineDemo(canvas, uiRoot))
  pauseMenu.onQuitGame(() => window.location.reload())

  // --- Engage ---
  function engageCombat() {
    if (combatStarted) return
    combatStarted = true
    player.inCombat = true
    boss.inCombat = true
    announce.show('战斗开始')
    bus.emit('combat:started', { entities: [player, boss] })
  }

  bus.on('damage:dealt', (payload: { source: Entity; target: Entity }) => {
    if (payload.target.id === boss.id && !combatStarted) engageCombat()
    if (payload.target.id === player.id && payload.target.hp <= 0) onBattleEnd('wipe')
  })

  // --- Timeline actions ---
  bus.on('timeline:action', (action: TimelineAction) => {
    if (battleOver) return

    if (action.action === 'use' && action.use) {
      const skill = enc.skills.get(action.use)
      if (skill) skillResolver.tryUse(boss, skill)
    }
    if (action.action === 'lock_facing' && action.facing != null) {
      bossAI.lockFacing(action.facing)
    }
    if (action.action === 'enable_ai') {
      aiEnabled = true
      bossAI.unlockFacing()
      boss.target = player.id
    }
    if (action.action === 'disable_ai') {
      aiEnabled = false
    }
    if (action.action === 'teleport' && action.position) {
      displacer.start(boss, action.position.x, action.position.y, 400)
    }
  })

  // --- Battle end ---
  function onBattleEnd(result: 'victory' | 'wipe') {
    if (battleOver) return
    battleOver = true
    bus.emit('combat:ended', { result })

    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.6); z-index: 80; cursor: pointer;
    `
    const text = document.createElement('h2')
    text.textContent = result === 'wipe' ? 'DEFEATED' : 'VICTORY'
    text.style.cssText = `
      font-size: 32px; color: ${result === 'wipe' ? '#ff4444' : '#44ff44'};
      font-weight: 300; letter-spacing: 6px; margin-bottom: 20px;
    `
    overlay.appendChild(text)
    const hint = document.createElement('p')
    hint.textContent = 'Click to retry'
    hint.style.cssText = 'font-size: 14px; color: #888;'
    overlay.appendChild(hint)
    overlay.addEventListener('click', () => startTimelineDemo(canvas, uiRoot))
    uiRoot.appendChild(overlay)
  }

  // --- Game loop ---
  let lastTime = performance.now()

  gameLoop.onUpdate((dt) => {
    if (paused || battleOver) return
    if (devTerminal.isVisible()) return

    const result = playerDriver.update(dt)
    if (result === 'pause') { paused = true; pauseMenu.show(); return }

    if (!combatStarted && bossAI.checkAggro(player)) engageCombat()

    if (combatStarted) {
      scheduler.update(dt)
    }

    if (aiEnabled && boss.alive && !boss.casting) {
      bossAI.updateFacing(player)
      bossAI.updateMovement(player, dt)
      if (bossAutoSkill && bossAI.tickAutoAttack(dt) && bossAI.isInAutoAttackRange(player)) {
        boss.target = player.id
        skillResolver.tryUse(boss, bossAutoSkill)
      }
    }

    displacer.update(dt)
    zoneMgr.update(dt)
    timelineDisplay.update(scheduler.elapsed, dt)
  })

  sceneManager.startRenderLoop(() => {
    const now = performance.now()
    const delta = now - lastTime
    lastTime = now

    const mousePos = sceneManager.pickGroundPosition()
    if (mousePos) input.updateMouseWorldPos(mousePos)
    gameLoop.tick(delta)

    const camPos = camera.update(delta)
    sceneManager.setCameraTarget(camPos.x, camPos.y)
    entityRenderer.updateAll(entityMgr.getAlive())
    aoeRenderer.update(now)
    hitEffectRenderer.update(delta, (id) => entityMgr.get(id))
    uiManager.update(player, boss, (sid) => skillResolver.getCooldown(player.id, sid))
    debugInfo.update(delta, player, combatStarted ? scheduler.elapsed : null)
  })

  const onResize = () => sceneManager.engine.resize()
  window.addEventListener('resize', onResize)

  cleanup = () => {
    sceneManager.dispose()
    input.dispose()
    window.removeEventListener('resize', onResize)
    while (uiRoot.firstChild) uiRoot.removeChild(uiRoot.firstChild)
  }
}
