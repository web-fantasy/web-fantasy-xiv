import { MainMenu } from './ui/main-menu'
import { startDemo } from './demo/demo-scene'
import { startBossAiDemo } from './demo/demo-boss-ai'
import { startTimelineDemo } from './demo/demo-timeline'

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
const uiRoot = document.getElementById('ui-overlay') as HTMLDivElement

new MainMenu(uiRoot, [
  {
    label: 'Training Dummy',
    description: 'Static target, test player skills',
    callback: () => startDemo(canvas, uiRoot),
  },
  {
    label: 'Boss AI Test',
    description: 'Aggro, tracking, auto-attack',
    callback: () => startBossAiDemo(canvas, uiRoot),
  },
  {
    label: 'Timeline Test',
    description: 'AOE mechanics showcase, 80s enrage',
    callback: () => startTimelineDemo(canvas, uiRoot),
  },
  {
    label: 'Mob Phase Test',
    description: 'Boss → Adds → Boss return',
    callback: () => startTimelineDemo(canvas, uiRoot, `${import.meta.env.BASE_URL}encounters/mob-phase-test.yaml`),
  },
  {
    label: 'Death Zone Test',
    description: 'Lethal boundary + inner death zone',
    callback: () => startTimelineDemo(canvas, uiRoot, `${import.meta.env.BASE_URL}encounters/deathzone-test.yaml`),
  },
  {
    label: 'Leviathan Test',
    description: 'Boat arena, side slap + camera tilt',
    callback: () => startTimelineDemo(canvas, uiRoot, `${import.meta.env.BASE_URL}encounters/leviathan-test.yaml`),
  },
])
