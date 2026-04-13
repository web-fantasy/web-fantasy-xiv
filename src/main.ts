import { MainMenu } from './ui/main-menu'
import { startDemo } from './demo/demo-scene'
import { startBossAiDemo } from './demo/demo-boss-ai'

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
])
