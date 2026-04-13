// src/ui/pause-menu.ts
export class PauseMenu {
  private container: HTMLDivElement
  private onResume: (() => void) | null = null
  private onQuit: (() => void) | null = null
  private _visible = false

  constructor(parent: HTMLDivElement) {
    this.container = document.createElement('div')
    this.container.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: none; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.6); z-index: 90;
    `

    const title = document.createElement('h2')
    title.textContent = 'PAUSED'
    title.style.cssText = `
      font-size: 28px; color: #ddd; margin-bottom: 30px;
      font-weight: 300; letter-spacing: 6px;
    `
    this.container.appendChild(title)

    const btnStyle = `
      padding: 10px 28px; font-size: 14px; margin: 6px;
      background: rgba(255,255,255,0.08); color: #bbb;
      border: 1px solid rgba(255,255,255,0.15); border-radius: 3px;
      cursor: pointer; letter-spacing: 1px; min-width: 160px;
    `

    const resumeBtn = document.createElement('button')
    resumeBtn.textContent = 'Resume'
    resumeBtn.style.cssText = btnStyle
    resumeBtn.addEventListener('click', () => this.onResume?.())
    this.container.appendChild(resumeBtn)

    const quitBtn = document.createElement('button')
    quitBtn.textContent = 'Quit to Menu'
    quitBtn.style.cssText = btnStyle
    quitBtn.addEventListener('click', () => this.onQuit?.())
    this.container.appendChild(quitBtn)

    parent.appendChild(this.container)
  }

  get visible(): boolean { return this._visible }

  show(): void {
    this._visible = true
    this.container.style.display = 'flex'
  }

  hide(): void {
    this._visible = false
    this.container.style.display = 'none'
  }

  onResumeGame(cb: () => void): void { this.onResume = cb }
  onQuitGame(cb: () => void): void { this.onQuit = cb }
}
