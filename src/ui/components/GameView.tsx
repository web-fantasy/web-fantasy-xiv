import { useEffect, useRef, useState } from 'preact/hooks'
import { useRoute } from 'preact-iso'
import { useEngine } from '../engine-context'
import { createStateAdapter } from '../state-adapter'
import { startTimelineDemo, getActiveScene, disposeActiveScene } from '@/demo/demo-timeline'
import { resetState, skillBarEntries as skillBarEntriesSignal, buffDefs as buffDefsSignal } from '../state'
import { DEMO_SKILL_BAR } from '@/demo/demo-skill-bar'
import { DEMO_BUFF_MAP } from '@/demo/demo-buffs'
import { BossHpBar, PlayerHpBar, PlayerMpBar } from './HpBar'
import { PlayerCastBar, BossCastBar } from './CastBar'
import { SkillBar } from './SkillBar'
import { BuffBar } from './BuffBar'
import { DamageFloater } from './DamageFloater'
import { CombatAnnounce } from './CombatAnnounce'
import { PauseMenu } from './PauseMenu'
import { BattleEndOverlay } from './BattleEndOverlay'
import { DebugInfo } from './DebugInfo'
import { Tooltip } from './Tooltip'

export function GameView() {
  const { params } = useRoute()
  const { canvas } = useEngine()
  const uiRef = useRef<HTMLDivElement>(null)
  const [gameKey, setGameKey] = useState(0)

  useEffect(() => {
    const uiRoot = uiRef.current!
    const id = params.id
    const base = import.meta.env.BASE_URL
    const encounterUrl = `${base}encounters/${id}.yaml`

    // Set skill bar + buff defs for UI components
    skillBarEntriesSignal.value = DEMO_SKILL_BAR
    buffDefsSignal.value = DEMO_BUFF_MAP

    startTimelineDemo(canvas!, uiRoot, encounterUrl)

    const scene = getActiveScene()
    let adapter: ReturnType<typeof createStateAdapter> | null = null

    if (scene) {
      adapter = createStateAdapter({
        bus: scene.bus,
        sceneManager: scene.sceneManager,
        buffSystem: scene.buffSystem,
      })

      scene.onRenderTick = (_delta) => {
        const bossForUI = scene.bossEntity ?? scene.player
        adapter!.writeFrame(
          scene.player,
          bossForUI,
          (sid) => scene.skillResolver.getCooldown(scene.player.id, sid),
        )
      }
    }

    return () => {
      adapter?.dispose()
      disposeActiveScene()
      resetState()
    }
  }, [params.id, canvas, gameKey])

  const handleRetry = () => setGameKey((k) => k + 1)

  return (
    <div ref={uiRef} class="absolute inset-0" style={{ pointerEvents: 'none' }}>
      <BossHpBar />
      <PlayerHpBar />
      <PlayerMpBar />
      <PlayerCastBar />
      <BossCastBar />
      <SkillBar />
      <BuffBar />
      <DamageFloater />
      <CombatAnnounce />
      <PauseMenu onRetry={handleRetry} />
      <BattleEndOverlay onRetry={handleRetry} />
      <DebugInfo />
      <Tooltip />
    </div>
  )
}
