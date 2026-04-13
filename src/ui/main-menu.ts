// src/ui/main-menu.ts

export interface MenuEntry {
  label: string
  description?: string
  callback: () => void
}

export class MainMenu {
  private container: HTMLDivElement

  constructor(parent: HTMLDivElement, entries: MenuEntry[]) {
    this.container = document.createElement('div')
    this.container.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.85); z-index: 100;
    `

    const title = document.createElement('h1')
    title.textContent = 'Web Fantasy XIV'
    title.style.cssText = `
      font-size: 36px; color: #e0e0e0; margin-bottom: 8px;
      font-weight: 300; letter-spacing: 4px;
    `
    this.container.appendChild(title)

    const subtitle = document.createElement('p')
    subtitle.textContent = 'Boss Battle Simulator'
    subtitle.style.cssText = `
      font-size: 14px; color: #888; margin-bottom: 40px;
      letter-spacing: 2px;
    `
    this.container.appendChild(subtitle)

    const btnStyle = `
      padding: 12px 32px; font-size: 15px; margin: 5px;
      background: rgba(255, 255, 255, 0.1); color: #ccc;
      border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px;
      cursor: pointer; transition: all 0.15s;
      letter-spacing: 1px; min-width: 240px; text-align: left;
    `

    for (const entry of entries) {
      const btn = document.createElement('button')
      btn.style.cssText = btnStyle

      const labelEl = document.createElement('div')
      labelEl.textContent = `▶  ${entry.label}`
      btn.appendChild(labelEl)

      if (entry.description) {
        const descEl = document.createElement('div')
        descEl.textContent = entry.description
        descEl.style.cssText = 'font-size: 11px; color: #777; margin-top: 2px;'
        btn.appendChild(descEl)
      }

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(255, 255, 255, 0.2)'
        btn.style.color = '#fff'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(255, 255, 255, 0.1)'
        btn.style.color = '#ccc'
      })
      btn.addEventListener('click', () => {
        this.hide()
        entry.callback()
      })
      this.container.appendChild(btn)
    }

    parent.appendChild(this.container)
  }

  hide(): void {
    this.container.style.display = 'none'
  }

  show(): void {
    this.container.style.display = 'flex'
  }
}
