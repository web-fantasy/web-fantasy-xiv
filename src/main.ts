import { startDemo } from './demo/demo-scene'

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
const uiRoot = document.getElementById('ui-overlay') as HTMLDivElement

startDemo(canvas, uiRoot)
