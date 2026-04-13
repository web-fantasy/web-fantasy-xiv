import { MainMenu } from './ui/main-menu'
import { startDemo } from './demo/demo-scene'

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
const uiRoot = document.getElementById('ui-overlay') as HTMLDivElement

const menu = new MainMenu(uiRoot)

menu.onStartGame(() => {
  menu.hide()
  startDemo(canvas, uiRoot)
})
