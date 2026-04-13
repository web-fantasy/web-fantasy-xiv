// src/ui/combat-announce.ts

export class CombatAnnounce {
  private container: HTMLDivElement

  constructor(parent: HTMLDivElement) {
    this.container = document.createElement('div')
    this.container.style.cssText = `
      position: absolute; top: 20%; left: 50%; transform: translateX(-50%);
      pointer-events: none; z-index: 60;
    `
    parent.appendChild(this.container)
  }

  show(text: string, duration = 2000): void {
    const el = document.createElement('div')
    el.textContent = text
    el.style.cssText = `
      font-size: 28px; font-weight: 300; letter-spacing: 6px;
      color: #e0e0e0; text-shadow: 0 0 12px rgba(0,0,0,0.8);
      opacity: 1; transition: opacity ${duration * 0.6}ms ease-out;
    `
    this.container.appendChild(el)

    // Start fade after a brief visible period
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.style.opacity = '0'
        setTimeout(() => el.remove(), duration * 0.6)
      }, duration * 0.4)
    })
  }
}
