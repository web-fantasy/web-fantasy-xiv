import { MainMenu } from './ui/main-menu'
import { startTimelineDemo } from './demo/demo-timeline'

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
const uiRoot = document.getElementById('ui-overlay') as HTMLDivElement
const base = import.meta.env.BASE_URL

async function init() {
  const res = await fetch(`${base}encounters/index.json`)
  const levels: { label: string; description: string; file: string }[] = await res.json()

  new MainMenu(uiRoot, levels.map((lv) => ({
    label: lv.label,
    description: lv.description,
    callback: () => startTimelineDemo(canvas, uiRoot, `${base}encounters/${lv.file}`),
  })))
}

init()
