import { useEffect, useRef, useState } from 'preact/hooks'
import { useRoute } from 'preact-iso'
import { useEngine } from '../engine-context'
import { createStateAdapter } from '../state-adapter'
import { startTimelineDemo, getActiveScene, disposeActiveScene } from '@/demo/demo-timeline'
import { resetState, skillBarEntries as skillBarEntriesSignal, buffDefs as buffDefsSignal } from '../state'
import { DEFAULT_JOB } from '@/demo/player-job'
import { BossHpBar, PlayerHpBar, PlayerMpBar } from './HpBar'
import { PlayerCastBar, BossCastBar } from './CastBar'
import { SkillBar } from './SkillBar'
import { BuffBar } from './BuffBar'
import { DamageFloater } from './DamageFloater'
import { CombatAnnounce } from './CombatAnnounce'
import { DialogBox } from './DialogBox'
import { PauseMenu } from './PauseMenu'
import { BattleEndOverlay } from './BattleEndOverlay'
import { DebugInfo } from './DebugInfo'
import { TimelineDisplay } from './TimelineDisplay'
import { Tooltip } from './Tooltip'
import { SkillPanel, toggleSkillPanel, useSkillPanelKey } from './SkillPanel'

function SkillPanelButton() {
  return (
    <div
      style={{
        position: 'absolute', bottom: 74, left: '50%',
        transform: 'translateX(calc(-50% + 180px))',
        pointerEvents: 'auto', cursor: 'pointer',
        width: 24, height: 24,
        background: 'rgba(0,0,0,0.7)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: '#aaa',
      }}
      title="技能一览 (P)"
      onClick={toggleSkillPanel}
    >
      ?
    </div>
  )
}

export function GameView() {
  useSkillPanelKey()
  const { params } = useRoute()
  const { canvas } = useEngine()
  const uiRef = useRef<HTMLDivElement>(null)
  const [gameKey, setGameKey] = useState(0)

  useEffect(() => {
    const uiRoot = uiRef.current!
    const id = params.id
    const base = import.meta.env.BASE_URL
    const encounterUrl = `${base}encounters/${id}.yaml`

    // Set skill bar + buff defs for HUD
    skillBarEntriesSignal.value = DEFAULT_JOB.skillBar
    buffDefsSignal.value = DEFAULT_JOB.buffMap as any

    let adapter: ReturnType<typeof createStateAdapter> | null = null
    let active = true

    startTimelineDemo(canvas!, uiRoot, encounterUrl).then(() => {
      if (!active) return
      const scene = getActiveScene()
      if (scene) {
        adapter = createStateAdapter({
          bus: scene.bus,
          sceneManager: scene.sceneManager,
          buffSystem: scene.buffSystem,
        })
        scene.onRenderTick = (delta) => {
          const bossForUI = scene.bossEntity ?? scene.player
          adapter!.writeFrame(
            scene.player,
            bossForUI,
            (sid) => scene.skillResolver.getCooldown(scene.player.id, sid),
          )
        }
      }
    })

    return () => {
      active = false
      adapter?.dispose()
      disposeActiveScene()
      resetState()
    }
  }, [params.id, canvas, gameKey])

  const handleRetry = () => setGameKey((k) => k + 1)

  return (
    <div
      ref={uiRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <BossHpBar />
      <PlayerHpBar />
      <PlayerMpBar />
      <PlayerCastBar />
      <BossCastBar />
      <SkillBar />
      <SkillPanelButton />
      <BuffBar />
      <DamageFloater />
      <CombatAnnounce />
      <DialogBox />
      <PauseMenu onRetry={handleRetry} />
      <BattleEndOverlay onRetry={handleRetry} />
      <DebugInfo />
      <TimelineDisplay />
      <Tooltip />
      <SkillPanel />
    </div>
  )
}
